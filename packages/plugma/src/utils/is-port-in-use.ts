import http from 'http'
/**
 * Checks if a port is already in use
 * @param port Port number to check
 * @returns Promise that resolves to true if port is in use
 */

export function isPortInUse(port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const server = http.createServer()
		server.once('error', (err: NodeJS.ErrnoException) => {
			if (err.code === 'EADDRINUSE') {
				resolve(true)
			}
		})
		server.once('listening', () => {
			server.close()
			resolve(false)
		})
		server.listen(port)
	})
}
