import { figmaApi } from "../figma-api-interceptors/figma-api";
import type { PlugmaRuntimeData, WindowSettings } from "../types";
import { getWindowSettings } from "../utils/get-window-settings";

declare const runtimeData: PlugmaRuntimeData;

const TOOLBAR_HEIGHT = 41;

export async function saveWindowSettings(settings: WindowSettings) {
	const command = runtimeData.command;
	const storageKey =
		command === "dev"
			? "PLUGMA_PLUGIN_WINDOW_SETTINGS_DEV"
			: "PLUGMA_PLUGIN_WINDOW_SETTINGS_PREVIEW";

	await figma.clientStorage.setAsync(storageKey, settings);
}

interface SaveWindowSettingsMessage {
	event: typeof handleSaveWindowSettings.EVENT_NAME;
	data: Partial<WindowSettings>;
	height: number;
	showToolbar: boolean;
}

/**
 * Handles saving window settings request.
 * Updates stored window dimensions and state.
 */

export async function handleSaveWindowSettings(
	msg: SaveWindowSettingsMessage,
): Promise<void> {
	getWindowSettings().then((pluginWindowSettings) => {
		// FIXME: For not only set it if data received. Really need a env variable so this event is not even posted by Plugin Window
		if (msg.data.height) {
			if (msg.data.toolbarEnabled) {
				// message.data.height = message.data.height + 40
				figmaApi.resize(
					msg.data.width,
					msg.data.height + TOOLBAR_HEIGHT,
				);
			} else {
				// message.data.height = message.data.height - 40
				figmaApi.resize(
					msg.data.width,
					msg.data.height - TOOLBAR_HEIGHT,
				);
			}
			let mergedOptions = Object.assign(pluginWindowSettings, msg.data);
			saveWindowSettings(mergedOptions);
		}
	});
}

handleSaveWindowSettings.EVENT_NAME =
	"PLUGMA_SAVE_PLUGIN_WINDOW_SETTINGS" as const;
