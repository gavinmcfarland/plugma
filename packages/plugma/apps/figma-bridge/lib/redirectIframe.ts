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

async function createBlobURLFromURL({ url, iframe }) {
	const response = await fetch(url)
	const contentType = response.headers.get('Content-Type') || 'text/html'
	const blob = await response.blob()
	const newBlobUrl = URL.createObjectURL(new Blob([blob], { type: contentType }))
	iframe.src = newBlobUrl
}

function watchViteReload({ url, iframe }) {
	const wsUrl = url.replace(/^http/, 'ws') + '/@vite/client'
	const socket = new WebSocket(wsUrl)

	console.log('wsUrl', socket)
	socket.addEventListener('open', () => {
		console.log('[vite-watch] ✅ Connected to Vite HMR server')
	})

	socket.addEventListener('error', (e) => {
		console.error('[vite-watch] ❌ WebSocket error:', e)
	})

	socket.addEventListener('message', async (event) => {
		const data = JSON.parse(event.data)

		if (data.type === 'full-reload' || data.type === 'update') {
			console.log('[vite-watch] ⚡ Detected Vite update — reloading iframe')

			try {
				const rawHtml = await fetch(url, { cache: 'no-store' }).then((res) => res.text())
				const htmlWithBase = injectBaseTag(rawHtml, url)
				iframe.srcdoc = htmlWithBase
			} catch (err) {
				console.error('[vite-watch] ❌ Failed to reload iframe:', err)
			}
		}
	})
}

function redirectUsingSrcDocWithPolling({ url, iframe, interval = 1000 }) {
	let previousHash = null

	async function hashString(str) {
		let hash = 5381
		for (let i = 0; i < str.length; i++) {
			hash = (hash * 33) ^ str.charCodeAt(i)
		}
		return String(hash >>> 0)
	}

	async function poll() {
		try {
			const rawHtml = await (await fetch(url, { cache: 'no-store' })).text()
			const hash = await hashString(rawHtml)

			if (hash !== previousHash) {
				console.log('⚡ UI updated — reloading iframe')
				previousHash = hash

				const htmlWithBase = injectBaseTag(rawHtml, url)
				iframe.srcdoc = htmlWithBase
			}
		} catch (err) {
			console.error('Failed to poll for updates:', err)
		}

		setTimeout(poll, interval)
	}

	poll() // start polling
}

// Simple hash function using Web Crypto
function hashString(str) {
	let hash = 5381
	for (let i = 0; i < str.length; i++) {
		hash = (hash * 33) ^ str.charCodeAt(i)
	}
	return String(hash >>> 0)
}

async function redirectUsingBlob({ url, iframe }) {
	// Using a blob
	const rawHtml = await (await fetch(url)).text()
	const htmlWithBase = injectBaseTag(rawHtml, url)
	const blob = new Blob([htmlWithBase], { type: 'text/html' })
	iframe.src = URL.createObjectURL(blob)
}

function injectBaseTag(html, baseHref) {
	// NOTE: Adding DOCTYPE breaks causes odd layout behaviour
	// if (!/^<!doctype html>/i.test(html.trim())) {
	// 	html = '<!DOCTYPE html>\n' + html
	// }

	// Inject base tag and CSP meta
	return html.replace(
		/<head([^>]*)>/i,
		`<head$1>
		<style>
			/* Missing when loading via scrDoc */
			table {
				line-height: normal;
			}
		</style>
		<base href="${baseHref}">
		<meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' ws: http: data: blob:;">
	  `,
	)
}

async function redirectUsingDataURI({ url, iframe }) {
	// Using a data URI
	// Note: This method doesn't re-render when the source changes
	const rawHtml = await (await fetch(url)).text()
	const htmlWithBase = injectBaseTag(rawHtml, url)
	const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlWithBase)
	iframe.src = dataUrl
}

async function redirectUsingSrcDoc({ url, iframe }) {
	// NOTE: Must have ws://localhost:<port> in devAllowedDomains, with port matching the dev server port
	const rawHtml = await (await fetch(url)).text()
	const htmlWithBase = injectBaseTag(rawHtml, url)
	iframe.srcdoc = htmlWithBase
}

async function redirectUsingSrc({ url, iframe }) {
	iframe.src = new URL(url).href
}

export async function redirectIframe(url: string, mode: 'href' | 'srcdoc' | 'blob' | 'data-uri') {
	const iframe = document.getElementById('dev-server-ui') as HTMLIFrameElement
	if (iframe) {
		// Verify server connection in the background and reload once available
		waitForServer(url)
			.then(async () => {
				// Using current method
				if (mode === 'href') {
					redirectUsingSrc({ url, iframe })
				} else if (mode === 'srcdoc') {
					redirectUsingSrcDoc({ url, iframe })
				} else if (mode === 'blob') {
					redirectUsingBlob({ url, iframe })
				} else if (mode === 'data-uri') {
					redirectUsingDataURI({ url, iframe })
				}

				// Set up message listener for iframe ready state
				const handleIframeLoad = () => {
					iframeState.isReady = true
					// Send all queued messages
					messageQueue.forEach((message) => {
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
