import { tick } from 'svelte'
import { isLocalhostWithoutPort } from './stores';

export function monitorUrl(url, iframe, onStatusChange) {
	let interval = 1000;
	let isServerActive = true; // Start as true

	async function checkUrl() {
		const appElement = document.getElementById('app'); // Select the element with id 'app'

		try {

			const response = await fetch(url);

			// Server is reachable
			if (response.ok && !isServerActive) {
				isServerActive = true;
				if (appElement) {
					appElement.style.display = 'block'; // Show the element when the server is active
				}

				await tick(); // Ensures the DOM updates when `isServerActive` changes
				onStatusChange(isServerActive); // Call the external function with the new status
			}
			// Server is unreachable but no error was thrown (e.g., non-2xx status)
			else if (!response.ok && isServerActive) {
				isServerActive = false;
				appElement.style.display = 'none'; // Hide the element when the server is not active
				await tick();
				onStatusChange(isServerActive);
			}
		} catch (error) {
			console.error(error)
			// If fetch fails, set isServerActive to false if it isn't already
			if (isServerActive) {
				isServerActive = false;
				if (appElement) {
					appElement.style.display = 'none'; // Hide the element if the server is down
				}
				await tick();
				onStatusChange(isServerActive); // Call the external function with the new status
			}
		}
	}

	// Trigger initial state update, so the DOM reflects that the server is active
	onStatusChange(isServerActive);

	function hasMatchingLocalhostOrWildcard() {
		if (
			!window.runtimeData ||
			!window.runtimeData.manifest ||
			!window.runtimeData.manifest.networkAccess ||
			!window.runtimeData.manifest.networkAccess.devAllowedDomains
		) {
			console.warn("networkAccess.devAllowedDomains is not defined or is not an array");
			return false;
		}

		const { devAllowedDomains } = window.runtimeData.manifest.networkAccess;

		// Return false if any domain matches the exclusion criteria
		const isExcluded = devAllowedDomains.some(domain => {
			// Check for a global wildcard "*", which should pass (do not exclude)
			if (domain === "*") {
				return false;
			}

			// Check for HTTP/HTTPS localhost entries with wildcard ports (e.g., http://localhost:*)
			const wildcardPortPattern = /^(http:\/\/localhost|https:\/\/localhost):\*$/;
			if (wildcardPortPattern.test(domain)) {
				return false;
			}

			// Check for localhost entries with a specific port (e.g., http://localhost:4000)
			const httpLocalhostWithPort = `http://localhost:${window.runtimeData.port}`;
			const httpsLocalhostWithPort = `https://localhost:${window.runtimeData.port}`;
			if (domain === httpLocalhostWithPort || domain === httpsLocalhostWithPort) {
				return false;
			}

			// Ignore any non-HTTP/HTTPS localhost domains, such as ws://
			if (!domain.startsWith("http://localhost") && !domain.startsWith("https://localhost")) {
				return false;
			}

			// If it's an HTTP/HTTPS localhost without a port, mark it as excluded (true)
			return true;
		});

		// If no exclusions matched, return true; otherwise, return false
		return !isExcluded;
	}

	// Check the URL immediately
	if (hasMatchingLocalhostOrWildcard()) {
		isLocalhostWithoutPort.set(false)
		checkUrl();
		// Continue checking at the specified interval
		setInterval(checkUrl, interval);
	}
	else {
		isLocalhostWithoutPort.set(true)

	}
}
