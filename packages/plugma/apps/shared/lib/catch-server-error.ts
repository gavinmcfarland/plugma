export function catchServerError(url: string) {
	return async (error: unknown) => {
		if (error instanceof Error) {
			// Handle connection refused errors
			if (error.message.includes('ERR_CONNECTION_REFUSED')) {
				console.error(`Failed to connect to ${url}. The server might be down or not running.`)
				throw new Error(`Server connection refused: ${url}`)
			}

			// Handle other network errors
			if (error.message.includes('Failed to fetch')) {
				console.error(`Network error when connecting to ${url}`)
				throw new Error(`Network error: ${url}`)
			}
		}

		// Handle unknown errors
		console.error(`Unexpected error when connecting to ${url}:`, error)
		throw error
	}
}
