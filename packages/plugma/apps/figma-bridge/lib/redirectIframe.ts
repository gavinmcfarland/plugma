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

// Message queue for messages sent before iframe is ready
const messageQueue: any[] = []
export const iframeState = {
	isReady: false,
}

// Function to send messages to iframe
export function sendMessageToIframe(message: any) {
	// FIXME: At the moment, messages are always queued because isReady is not reactive
	const iframe = document.getElementById('dev-server-ui') as HTMLIFrameElement
	if (iframe?.contentWindow && iframeState.isReady) {
		iframe.contentWindow.postMessage(message, '*')
	} else {
		messageQueue.push(message)
	}
}

export async function redirectIframe(url: string) {
	const iframe = document.getElementById('dev-server-ui') as HTMLIFrameElement
	if (iframe) {
		// Set the iframe source immediately
		// iframe.src = new URL(url).href

		// Verify server connection in the background and reload once available
		waitForServer(url)
			.then(() => {
				// Server is available, reload the iframe
				iframe.src = new URL(url).href

				// Set up message listener for iframe ready state
				const handleIframeLoad = () => {
					iframeState.isReady = true
					// Send all queued messages
					messageQueue.forEach((message) => {
						console.log('sending message', message)
						iframe.contentWindow?.postMessage(message, '*')
					})
					messageQueue.length = 0 // Clear the queue
					iframe.removeEventListener('load', handleIframeLoad)
				}

				iframe.addEventListener('load', handleIframeLoad)
			})
			.catch((err) => {
				console.error(`Failed to connect to ${url}:`, err)
			})
	}
}
