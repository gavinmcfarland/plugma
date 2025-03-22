import { figmaApi } from "../figma-api-interceptors/figma-api.js";
import type { PluginMessage } from "../types.js";
import { getWindowSettings } from "../utils/get-window-settings.js";
import { saveWindowSettings } from "./save-window-settings.js";

/**
 * Handles window minimization request.
 * Sets window dimensions to minimized state (200x40) and updates settings.
 */
export async function handleMinimizeWindow(_msg: PluginMessage): Promise<void> {
	if (!figmaApi) throw new Error("Figma API not available");

	const settings = await getWindowSettings();
	settings.minimized = true;
	figmaApi.resize(200, 40);
	await saveWindowSettings(settings);
}

handleMinimizeWindow.EVENT_NAME = "PLUGMA_MINIMIZE_WINDOW" as const;
