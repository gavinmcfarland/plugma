import { get } from 'svelte/store'
import { devServerIframe } from '../../shared/stores'

/**
 * Redirects the iframe to a new URL.
 * Note: This function should be called early in the process to ensure messages are not lost
 * due to delayed iframe redirection. Consider implementing message queuing if needed.
 */

async function waitForServer(url: string, timeout = 10000, interval = 300): Promise<void> {
	const start = Date.now()

	while (Date.now() - start < timeout) {
		try {
			const response = await fetch(url, { method: 'HEAD' })
			if (response.ok) return
		} catch (err) {
			// server not up yet
		}
		await new Promise((resolve) => setTimeout(resolve, interval))
	}

	throw new Error(`Server did not respond within ${timeout}ms`)
}

export async function redirectIframe(url: string) {
	const iframe = document.getElementById('dev-server-ui') as HTMLIFrameElement
	if (iframe) {
		// If iframe source is not set immediately, then messages will be lost which are post from figma main
		iframe.src = new URL(url).href

		// Verify server connection in the background and reload once available
		waitForServer(url)
			.then(() => {
				// Server is available, reload the iframe
				iframe.src = new URL(url).href
			})
			.catch((err) => {
				console.error(`Failed to connect to ${url}:`, err)
			})
	}
}
