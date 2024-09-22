export function setupWebSocket(url, onMessageCallback) {
	let ws;
	let shouldReconnect = true;
	let reconnectTimeout = 1000;
	let maxReconnectTimeout = 30000;
	let reconnectAttempts = 0;

	function connect() {
		ws = new WebSocket(url);

		ws.onopen = function () {
			console.log('WebSocket connected');
			reconnectAttempts = 0; // Reset attempts on successful connection
		};

		ws.onmessage = function (event) {
			if (onMessageCallback) {
				onMessageCallback(event);
			}
		};

		ws.onclose = function () {
			if (shouldReconnect) {
				console.log(`WebSocket closed, attempting to reconnect... (Attempt ${reconnectAttempts + 1})`);
				reconnectAttempts++;
				setTimeout(connect, Math.min(reconnectTimeout * reconnectAttempts, maxReconnectTimeout));
			}
		};

		ws.onerror = function (error) {
			console.error('WebSocket error:', error);
			ws.close(); // Ensure to close the WebSocket on error
		};
	}

	function disconnect() {
		shouldReconnect = false;
		if (ws) {
			ws.close();
		}
	}

	function send(message) {
		const waitForOpenConnection = () => {
			return new Promise((resolve, reject) => {
				const maxRetries = 10;
				let retries = 0;
				const interval = setInterval(() => {
					if (ws.readyState === WebSocket.OPEN) {
						clearInterval(interval);
						resolve();
					} else if (retries >= maxRetries) {
						clearInterval(interval);
						reject(new Error('WebSocket connection failed to open.'));
					}
					retries++;
				}, 100);
			});
		};

		const send = async () => {
			try {
				if (ws.readyState !== WebSocket.OPEN) {
					await waitForOpenConnection();
				}
				ws.send(JSON.stringify(message));
			} catch (error) {
				console.error('Failed to send message:', error);
			}
		};

		send();
	}

	connect();

	return {
		sendMessage,
		disconnect,
	};
}
