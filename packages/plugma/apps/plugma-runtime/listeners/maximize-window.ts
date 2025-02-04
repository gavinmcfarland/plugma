import { figmaApi } from '../interceptors/figma-api';
import type { PluginMessage } from '../types';
import { getWindowSettings } from '../utils/get-window-settings';
import { saveWindowSettings } from './save-window-settings';

/**
 * Handles window maximization request.
 * Restores window to previous dimensions and updates settings.
 */
export async function handleMaximizeWindow(_msg: PluginMessage): Promise<void> {
  if (!figmaApi) throw new Error('Figma API not available');

  const settings = await getWindowSettings();
  settings.minimized = false;
  const height = settings.toolbarEnabled
    ? settings.height + 41
    : settings.height;
  figmaApi.resize(settings.width, height);
  await saveWindowSettings(settings);
}

handleMaximizeWindow.EVENT_NAME = 'PLUGMA_MAXIMIZE_WINDOW' as const;
