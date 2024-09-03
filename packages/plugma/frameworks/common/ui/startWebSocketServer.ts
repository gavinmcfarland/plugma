let isConnected;

function throttle(mainFunction, delay) {
  let timerFlag = null; // Variable to keep track of the timer

  // Returning a throttled version
  return (...args) => {
    if (timerFlag === null) {
      // If there is no timer currently running
      mainFunction(...args); // Execute the main function
      timerFlag = setTimeout(() => {
        // Set a timer to clear the timerFlag after the specified delay
        timerFlag = null; // Clear the timerFlag to allow the main function to be executed again
      }, delay);
    }
  };
}

const ws = { current: null };
let hasLoggedError = false; // Flag to control error logging

function onWindowMsg(msg) {
  if (msg.data.pluginMessage) {
    const message = JSON.stringify(msg.data.pluginMessage);

    // Check if ws.current is initialized and in OPEN state
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    } else if (ws.current && ws.current.readyState !== WebSocket.OPEN) {
      // Retry sending the message after some delay if WebSocket isn't open yet
      setTimeout(() => {
        onWindowMsg(msg);
      }, 1000);
    } else if (!hasLoggedError) {
      // Log the error only if it has not been logged yet
      console.warn("WebSocket is not initialized or is in an invalid state.");
      hasLoggedError = true; // Set the flag after logging the error
    }
  }
}

function startWebSocketServer() {
  if (
    ws.current &&
    (ws.current.readyState === WebSocket.CONNECTING ||
      ws.current.readyState === WebSocket.OPEN)
  ) {
    // console.log("WebSocket is already open or connecting");
    return;
  }

  try {
    ws.current = new WebSocket("ws://localhost:9001/ws");
  } catch (error) {
    console.log("--error", error);
  }

  ws.current.onopen = () => {
    // Reset error log flag when connection is successfully opened
    hasLoggedError = false;
  };

  ws.current.onclose = () => {
    // Attempt to reconnect
    setTimeout(() => {
      startWebSocketServer();
    }, 3000);
  };

  ws.current.onerror = (error) => {
    // To prevent the error message appearing repeatedly
    if (!hasLoggedError) {
      console.error("WebSocket error:", error);
      hasLoggedError = true;
    }
  };

  ws.current.onmessage = (event) => {
    try {
      let msg = JSON.parse(event.data);

      if (msg.src === "server") {
        let temp = JSON.parse(msg.message);
        window.parent.postMessage(
          {
            pluginMessage: temp,
            pluginId: "*",
          },
          "*"
        );
      }
    } catch (err) {
      console.error("Invalid WebSocket message:", err);
    }
  };

  window.removeEventListener("message", onWindowMsg);
  window.addEventListener("message", onWindowMsg);

  return () => {
    ws.current.close();
    window.removeEventListener("message", onWindowMsg);
  };
}

startWebSocketServer();

// Backup the original console.error function
const originalConsoleError = console.error;

// Don't forget to restore the original console.error when appropriate
// console.error = originalConsoleError;

export { startWebSocketServer };
