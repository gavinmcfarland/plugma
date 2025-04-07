// Encoding and decoding functions for WebSocket messages
export const encodeMessage = (message: any) => {
	return JSON.stringify(message, (key, value) => {
		if (value instanceof Uint8Array) {
			return {
				__type: "Uint8Array",
				value: btoa(String.fromCharCode(...value)), // Convert Uint8Array to Base64
			};
		}
		return value; // Leave other values unchanged
	});
};
