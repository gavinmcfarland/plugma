import { get } from "svelte/store";
import { devServerIframe } from "../../shared/stores";

/**
 * Redirects the iframe to a new URL.
 * Note: This function should be called early in the process to ensure messages are not lost
 * due to delayed iframe redirection. Consider implementing message queuing if needed.
 */

export function redirectIframe(url: string) {
	const iframe = get(devServerIframe);
	if (iframe) {
		iframe.src = new URL(url).href;
	}
}
