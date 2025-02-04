import createDebugger from 'debug';
import ReconnectingWebSocket from 'reconnecting-websocket';
import {
	localClientConnected,
	pluginWindowClients,
	remoteClients,
} from '../stores.js';

const logger = createDebugger('plugma:setupWebSocket');

const isInsideIframe = window.self !== window.top;
const isInsideFigma = typeof figma !== 'undefined';

// Temporary buffer for managing plugin-window clients
let pluginWindowClientsBuffer = [];

interface ExtendedWebSocket extends ReconnectingWebSocket {
  post: (messages: any, via: any) => void;
  on: (callback: any, via: any) => void;
  open: (callback: () => void) => void;
  close: (callback?: () => void) => void;
}

// Encoding and decoding functions for WebSocket messages
const encodeMessage = (message) => {
  return JSON.stringify(message, (key, value) => {
    if (value instanceof Uint8Array) {
      return {
        __type: 'Uint8Array',
        value: btoa(String.fromCharCode(...value)), // Convert Uint8Array to Base64
      };
    }
    return value; // Leave other values unchanged
  });
};

const decodeMessage = (message) => {
  return JSON.parse(message, (key, value) => {
    if (value && value.__type === 'Uint8Array') {
      return new Uint8Array(
        atob(value.value)
          .split('')
          .map((char) => char.charCodeAt(0)),
      ); // Convert Base64 back to Uint8Array
    }
    return value; // Leave other values unchanged
  });
};

export function setupWebSocket(
  iframeTarget = null,
  enableWebSocket = true,
  registerSource = false,
): ExtendedWebSocket | typeof mockWebSocket {
  const messageQueue: any[] = [];
  const openCallbacks: (() => void)[] = [];
  const closeCallbacks: (() => void)[] = [];
  let pingInterval: number;

  const mockWebSocket = {
    send: (data) => {
      console.warn('WebSocket is disabled, cannot send data:', data);
    },
    post: (messages, via) => {
      if (Array.isArray(messages)) {
        messages.forEach((message) => sendMessageToTargets(message, via));
      } else {
        sendMessageToTargets(messages, via);
      }
    },
    on: (callback, via) => {
      if (Array.isArray(via)) {
        via.forEach((method) => addMessageListener(method, callback));
      } else {
        addMessageListener(via, callback);
      }
    },
    open: (callback) => {},
    close: (callback) => {
      // console.warn('WebSocket is disabled, no connection to close.')
      if (callback) {
        callback();
      }
    },
    addEventListener: (type, listener) => {},
    removeEventListener: (type, listener) => {},
    onmessage: null,
    onopen: null,
    onclose: null,
    onerror: null,
  };

  function sendMessageToTargets(message, via) {
    if (Array.isArray(via)) {
      via.forEach((option) => postMessageVia(option, message));
    } else {
      postMessageVia(via, message);
    }
  }

  function postMessageVia(via, message) {
    logger.info(`--- ws post, ${via}`, message);
    if (
      via === 'iframe' &&
      iframeTarget &&
      iframeTarget.contentWindow.postMessage
    ) {
      iframeTarget.contentWindow.postMessage(message, '*');
    } else if (via === 'parent' && window.parent) {
      window.parent.postMessage(message, '*');
    } else if (via === 'ws') {
      if (enableWebSocket) {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          // console.warn('WebSocket is disabled or not open, queuing message:', message)
          messageQueue.push({ message, via });
        } else {
          try {
            const encodedMessage = encodeMessage(message);
            ws.send(encodedMessage);
          } catch (error) {
            console.log('1', error);
          }
        }
      }
    } else {
      console.warn(`Cannot send message via ${via}.`);
    }
  }

  function addMessageListener(via, callback) {
    if (via === 'window') {
      window.addEventListener('message', callback);
    } else if (via === 'parent' && window.parent) {
      window.addEventListener('message', (event) => {
        if (event.source === window.parent) {
          callback(event);
        }
      });
    } else if (via === 'ws' && enableWebSocket) {
      ws.addEventListener('message', (event) => {
        try {
          const parsedData = decodeMessage(event.data);
          const newEvent = { ...event, data: parsedData };
          callback(newEvent);
        } catch (error) {
          console.error('Failed to parse WebSocket message data:', error);
          callback(event);
        }
      });
    } else {
      // console.warn(`Cannot add message listener via ${via}.`)
    }
  }

  if (!enableWebSocket || !('WebSocket' in window)) {
    return mockWebSocket;
  }

  let source = '';

  if (registerSource) {
    if (isInsideIframe || isInsideFigma) {
      source = `?source=plugin-window`;
    } else {
      source = `?source=browser`;
    }
  }

  const ws = new ReconnectingWebSocket(
    `ws://localhost:9001/ws${source}`,
  ) as ExtendedWebSocket;

  ws.post = (messages, via = ['ws']) => {
    if (Array.isArray(messages)) {
      messages.forEach((message) => sendMessageToTargets(message, via));
    } else {
      sendMessageToTargets(messages, via);
    }
  };

  ws.on = (callback, via = ['ws']) => {
    if (Array.isArray(via)) {
      via.forEach((method) => addMessageListener(method, callback));
    } else {
      addMessageListener(via, callback);
    }
  };

  ws.open = (callback: () => void) => {
    openCallbacks.push(callback);
    if (ws.readyState === WebSocket.OPEN) {
      callback();
    }
  };

  ws.close = (callback?: () => void) => {
    closeCallbacks.push(callback);
    if (ws.readyState === WebSocket.OPEN) {
      ws.addEventListener('close', () => {
        clearInterval(pingInterval);
        closeCallbacks.forEach((cb) => cb && cb());
      });
      ws.close();
    } else {
      logger.info('WebSocket is not open, nothing to close.');
      if (callback) {
        callback();
      }
    }
  };

  if (enableWebSocket) {
    ws.onopen = () => {
      openCallbacks.forEach((cb) => cb());
      while (messageQueue.length > 0) {
        const { message, via } = messageQueue.shift();
        sendMessageToTargets(message, via);
      }

      // Handle local client connection (not inside iframe or Figma)
      // if (!(isInsideIframe || isInsideFigma)) {
      localClientConnected.set(true);
      // }

      pingInterval = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const message = {
            pluginMessage: { event: 'ping' },
            pluginId: '*',
          };

          try {
            const encodedMessage = encodeMessage(message);
            ws.send(encodedMessage);
          } catch (error) {
            console.log('2', error);
          }
        }
      }, 10000);
    };

    ws.onmessage = (event) => {
      try {
        logger.info('Received raw WebSocket message:', event.data);

        if (!event.data) {
          logger.warn('Received empty message');
          return;
        }

        let message;
        try {
          message = decodeMessage(event.data);
        } catch (error) {
          logger.warn('Failed to parse WebSocket message:', event.data);
          return;
        }

        if (message.pluginMessage) {
          if (message.pluginMessage.event === 'ping') {
            const message = {
              pluginMessage: { event: 'pong' },
              pluginId: '*',
            };

            try {
              const encodedMessage = encodeMessage(message);
              ws.send(encodedMessage);
            } catch (error) {
              console.log('3', error);
            }
          }

          // Helper function to update the Svelte store with filtered plugin-window clients
          let graceTimeout = null; // Timeout handle for the grace period

          // Helper function to update the Svelte store
          // Helper function to update the Svelte store
          function updateFigmaBridgeClients() {
            const pluginWindowClientsRemaining =
              pluginWindowClientsBuffer.filter(
                (client) => client.source === 'plugin-window',
              );

            // If no plugin-window clients are left, wait before updating to []
            if (pluginWindowClientsRemaining.length === 0) {
              // console.log('No plugin-window clients connected. Waiting for grace period.')

              // Set a grace period before marking the store as empty
              if (!graceTimeout) {
                graceTimeout = setTimeout(() => {
                  // Re-check the buffer after the grace period
                  const finalFigmaBridgeClientsRemaining =
                    pluginWindowClientsBuffer.filter(
                      (client) => client.source === 'plugin-window',
                    );

                  if (finalFigmaBridgeClientsRemaining.length === 0) {
                    // console.log('Grace period over. Setting pluginWindowClients to empty.')
                    pluginWindowClients.set([]);
                  } else {
                    // console.log(
                    // 	'Grace period over. Clients reconnected:',
                    // 	finalFigmaBridgeClientsRemaining,
                    // )
                    pluginWindowClients.set(finalFigmaBridgeClientsRemaining);
                  }

                  graceTimeout = null; // Clear the timeout handle
                }, 200); // Grace period of 500ms (adjust as needed)
              }
            } else {
              // Update the store immediately if there are clients remaining
              pluginWindowClients.set(pluginWindowClientsRemaining);
            }
          }

          if (message.pluginMessage.event === 'client_list') {
            // if (!(isInsideIframe || isInsideFigma)) {
            const connectedClients = message.pluginMessage.clients || [];
            const browserClientsX = connectedClients.filter(
              (client) => client.source === 'browser',
            );
            const pluginWindowClientsX = connectedClients.filter((client) => {
              pluginWindowClientsBuffer.push(client);
              return client.source === 'plugin-window';
            });
            remoteClients.set(browserClientsX); // Set the connected clients
            // pluginWindowClients.set(pluginWindowClientsX) // Set the connected clients
            updateFigmaBridgeClients();

            // }
          }

          // Event Handlers
          if (message.pluginMessage.event === 'client_connected') {
            if (message.pluginMessage.client.source === 'plugin-window') {
              // Add the client to the buffer
              pluginWindowClientsBuffer.push(message.pluginMessage.client);

              // Immediately cancel the grace period and update the store
              if (graceTimeout) {
                // console.log('Canceling grace period due to new client connection.')
                clearTimeout(graceTimeout);
                graceTimeout = null;
              }

              // Update the store immediately
              pluginWindowClients.set(
                pluginWindowClientsBuffer.filter(
                  (client) => client.source === 'plugin-window',
                ),
              );
            }

            if (message.pluginMessage.client.source === 'browser') {
              remoteClients.update((clients) => [
                ...clients,
                message.pluginMessage.client,
              ]);
            }
          } else if (message.pluginMessage.event === 'client_disconnected') {
            // Remove the client from the buffer
            pluginWindowClientsBuffer = pluginWindowClientsBuffer.filter(
              (client) => client.id !== message.pluginMessage.client.id,
            );

            // Update the store with grace period logic
            updateFigmaBridgeClients();

            remoteClients.update((clients) =>
              clients.filter(
                (client) => client.id !== message.pluginMessage.client.id,
              ),
            );
          }
        }
      } catch (error) {
        logger.error('Error in message listener:', error);
      }
    };

    ws.onclose = () => {
      clearInterval(pingInterval);
      closeCallbacks.forEach((cb) => cb && cb());

      // Handle local client disconnection (not inside iframe or Figma)
      // if (!(isInsideIframe || isInsideFigma)) {
      localClientConnected.set(false);
      // }

      console.warn('WebSocket connection closed');
    };
  }

  return ws;
}
