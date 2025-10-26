import { isDevServerActive } from '../stores'

let monitoringInterval: ReturnType<typeof setInterval> | null = null

export async function waitForServer(
	url: string,
	timeout = 10000,
	interval = 1000,
	maxRetries = 20,
): Promise<{ active: boolean }> {
	const start = Date.now()

	let retryCount = 0
	while (Date.now() - start < timeout) {
		console.log('checking server', url)
		try {
			const response = await fetch(url, { method: 'HEAD' })
			if (response.ok) {
				console.log('server is up')
				isDevServerActive.set(response.ok)
				// Start continuous monitoring
				startMonitoring(url, interval)
				return { active: true }
			}
		} catch (err) {
			// server not up yet
			console.log('server not up yet')
			isDevServerActive.set(false)
			if (retryCount >= maxRetries) {
				return { active: false }
			}
			retryCount++
		}
		await new Promise((resolve) => setTimeout(resolve, interval))
	}

	return { active: false }
}

function startMonitoring(url: string, interval: number) {
	// Clear any existing monitoring interval
	if (monitoringInterval) {
		clearInterval(monitoringInterval)
	}

	// Check server status immediately
	const checkServer = async () => {
		try {
			const response = await fetch(url, { method: 'HEAD' })
			isDevServerActive.set(response.ok)
		} catch (err) {
			isDevServerActive.set(false)
		}
	}

	// Perform initial check
	checkServer()

	// Start new monitoring interval
	monitoringInterval = setInterval(checkServer, interval)
}

// Function to stop monitoring if needed
export function stopMonitoring() {
	if (monitoringInterval) {
		clearInterval(monitoringInterval)
		monitoringInterval = null
	}
}
