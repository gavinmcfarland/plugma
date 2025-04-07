export const decodeMessage = (message: any) => {
	return JSON.parse(message, (key, value) => {
		if (value && value.__type === "Uint8Array") {
			return new Uint8Array(
				atob(value.value)
					.split("")
					.map((char) => char.charCodeAt(0)),
			); // Convert Base64 back to Uint8Array
		}
		return value; // Leave other values unchanged
	});
};
