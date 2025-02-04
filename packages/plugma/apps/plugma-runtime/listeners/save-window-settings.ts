import { figmaApi } from '../interceptors/figma-api';
import type { PlugmaRuntimeData, WindowSettings } from '../types';
import { getWindowSettings } from '../utils/get-window-settings';

declare const runtimeData: PlugmaRuntimeData;

export async function saveWindowSettings(settings: WindowSettings) {
  const command = runtimeData.command;
  const storageKey =
    command === 'dev'
      ? 'PLUGMA_PLUGIN_WINDOW_SETTINGS_DEV'
      : 'PLUGMA_PLUGIN_WINDOW_SETTINGS_PREVIEW';

  await figma.clientStorage.setAsync(storageKey, settings);
}

/**
 * Handles saving window settings request.
 * Updates stored window dimensions and state.
 */
export function handleSaveWindowSettings() {
  figma.ui.onmessage = async (msg) => {
    if (msg.type === 'PLUGMA_SAVE_PLUGIN_WINDOW_SETTINGS') {
      // Add back toolbar height adjustment
      const height = msg.height - (msg.showToolbar ? TOOLBAR_HEIGHT : 0);

      // Maintain original storage key format
      const storageKey = `PLUGMA_PLUGIN_WINDOW_SETTINGS_${
        process.env.NODE_ENV === 'development' ? 'DEV' : 'PREVIEW'
      }`;

      if (!figmaApi) throw new Error('Figma API not available');

      if (!msg.data) return;

      const settings = await getWindowSettings();
      const newSettings = msg.data as Partial<WindowSettings>;
      const mergedSettings = { ...settings, ...newSettings };

      if (newSettings.height) {
        figmaApi.resize(mergedSettings.width, height);
      }

      saveWindowSettings(mergedSettings);
    }
  };
}

handleSaveWindowSettings.EVENT_NAME =
  'PLUGMA_SAVE_PLUGIN_WINDOW_SETTINGS' as const;
