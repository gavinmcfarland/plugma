import { writable } from 'svelte/store';

// Global state for the selected package manager across all code blocks
export const selectedPackageManager = writable('npm');

// Function to update the selected package manager
export function setPackageManager(manager: string) {
	selectedPackageManager.set(manager);
}

// Function to get the current package manager
export function getPackageManager() {
	let currentManager = 'npm';
	selectedPackageManager.subscribe((value) => {
		currentManager = value;
	})();
	return currentManager;
}
