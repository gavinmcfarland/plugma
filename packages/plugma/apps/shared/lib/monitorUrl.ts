import { tick } from 'svelte'
import { isLocalhostWithoutPort } from '../stores'
import { get } from 'svelte/store'

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
	 * Checks if the URL is reachable and updates state accordingly
	 */
	async function checkUrl() {
		try {
			const response = await fetch(url)
			await updateUIState(response.ok)
		} catch (error) {
			console.error('Server check failed:', error)
			await updateUIState(false)
		}
	}

	/**
	 * Validates if manifest.networkAccess.devAllowedDomains configuration is valid
	 */
	function hasValidLocalhostConfig(): boolean {
		const { runtimeData } = window

		console.log('runtimeData', runtimeData)

		if (!runtimeData?.manifest?.networkAccess?.devAllowedDomains) {
			console.warn('networkAccess.devAllowedDomains is not defined or is not an array')
			return false
		}

		const { devAllowedDomains } = runtimeData.manifest.networkAccess

		// Return false if any domain matches the exclusion criteria
		const isExcluded = devAllowedDomains.some((domain) => {
			// Allow global wildcard
			if (domain === '*') return false

			// Allow localhost with wildcard ports
			const wildcardPortPattern = /^https?:\/\/localhost:\*$/
			if (wildcardPortPattern.test(domain)) return false

			// Allow localhost with specific port
			const currentPort = window.runtimeData.port
			const localhostWithPort = [`http://localhost:${currentPort}`, `https://localhost:${currentPort}`]
			if (localhostWithPort.includes(domain)) return false

			// Ignore non-HTTP/HTTPS localhost domains
			if (!domain.startsWith('http://localhost') && !domain.startsWith('https://localhost')) {
				return false
			}

			// Exclude HTTP/HTTPS localhost without port
			return true
		})

		return !isExcluded
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
