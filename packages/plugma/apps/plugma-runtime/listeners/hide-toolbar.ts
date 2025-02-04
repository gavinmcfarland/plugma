import { figmaApi } from '../interceptors/figma-api';
import type { PluginMessage } from '../types';
import { getWindowSettings } from '../utils/get-window-settings';
import { saveWindowSettings } from './save-window-settings';

/**
 * Handles toolbar visibility toggle request.
 * Updates window height and settings based on toolbar state.
 */
export async function handleHideToolbar(_msg: PluginMessage): Promise<void> {
  if (!figmaApi) throw new Error('Figma API not available');

  const settings = await getWindowSettings();
  settings.toolbarEnabled = false;
  figmaApi.resize(settings.width, settings.height);

  await saveWindowSettings(settings);
}

handleHideToolbar.EVENT_NAME = 'PLUGMA_HIDE_TOOLBAR' as const;
