import { tick } from 'svelte'

export function monitorUrl(url, iframe, onStatusChange) {
	let interval = 1000
	let isServerActive = false;

	async function checkUrl() {
		try {
			const response = await fetch(url);
			if (isServerActive !== response.ok) {
				isServerActive = response.ok;
				await tick(); // Ensures the DOM updates when `isServerActive` changes
				onStatusChange(isServerActive); // Call the external function with the new status
			}
		} catch {
			if (isServerActive !== false) {
				isServerActive = false;
				await tick();
				onStatusChange(isServerActive); // Call the external function with the new status
			}
		}
		iframe.style.display = isServerActive ? 'block' : 'none';
	}

	// Check the URL immediately
	checkUrl();

	// Continue checking at the specified interval
	setInterval(checkUrl, interval);
}
