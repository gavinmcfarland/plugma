import { tick } from 'svelte'

/**
 * Monitors a URL for availability and updates UI accordingly
 */
export function monitorUrl(url: string, onStatusChange: (isDevServerActive: boolean) => void) {
	const POLLING_INTERVAL = 1000
	let isDevServerActive = true

	/**
	 * Updates the UI based on server status
	 */
	async function updateUIState(newActiveState: boolean) {
		const appElement = document.getElementById('app')

		if (isDevServerActive === newActiveState) return

		isDevServerActive = newActiveState
		if (appElement) {
			appElement.style.display = newActiveState ? 'block' : 'none'
		}

		await tick()
		onStatusChange(isDevServerActive)
	}

	/**
	 * Checks if the URL is reachable
	 */
	async function checkUrl() {
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), 1000)

		try {
			const response = await fetch(url, {
				method: 'GET',
				signal: controller.signal,
				mode: 'no-cors',
				credentials: 'omit',
			})
			clearTimeout(timeoutId)
			// With no-cors mode, we can't check response.ok, so we'll assume success if we get here
			await updateUIState(true)
		} catch (error) {
			clearTimeout(timeoutId)
			await updateUIState(false)
		}
	}

	// Initialize monitoring
	function initializeMonitoring() {
		checkUrl()
		setInterval(checkUrl, POLLING_INTERVAL)
	}

	// Start monitoring
	onStatusChange(isDevServerActive)
	initializeMonitoring()
}
