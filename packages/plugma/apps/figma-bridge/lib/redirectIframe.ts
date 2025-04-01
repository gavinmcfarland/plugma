import { get } from "svelte/store";
import { devServerIframe } from "../../shared/stores";

export function redirectIframe(url: string) {
	const iframe = get(devServerIframe);
	if (iframe) {
		iframe.src = new URL(url).href;
	}
}
