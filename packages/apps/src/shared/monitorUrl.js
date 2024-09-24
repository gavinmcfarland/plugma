import { tick } from 'svelte'

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
		} catch {
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

	// Check the URL immediately
	checkUrl();

	// Continue checking at the specified interval
	setInterval(checkUrl, interval);
}
