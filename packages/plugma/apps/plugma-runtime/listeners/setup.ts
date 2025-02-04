import type { EventRegistry, PluginMessage } from '../types.js';
import { handleDeleteClientStorage } from './delete-client-storage.js';
import { handleDeleteFileStorage } from './delete-file-storage.js';
import { handleGetOnRunMessages } from './get-on-run-messages.js';
import { handleHideToolbar } from './hide-toolbar.js';
import { handleMaximizeWindow } from './maximize-window.js';
import { handleMinimizeWindow } from './minimize-window.js';
import { handleSaveOnRunMessages } from './save-on-run-messages.js';
import { handleSaveWindowSettings } from './save-window-settings.js';

/**
 * Map of event handlers to ensure no duplicate event names
 */
const handlers: EventRegistry = {
  [handleDeleteFileStorage.EVENT_NAME]: handleDeleteFileStorage,
  [handleDeleteClientStorage.EVENT_NAME]: handleDeleteClientStorage,
  [handleSaveOnRunMessages.EVENT_NAME]: handleSaveOnRunMessages,
  [handleGetOnRunMessages.EVENT_NAME]: handleGetOnRunMessages,
  [handleMinimizeWindow.EVENT_NAME]: handleMinimizeWindow,
  [handleMaximizeWindow.EVENT_NAME]: handleMaximizeWindow,
  [handleHideToolbar.EVENT_NAME]: handleHideToolbar,
  [handleSaveWindowSettings.EVENT_NAME]: handleSaveWindowSettings,
} as const;

/**
 * Sets up event listeners for the Figma plugin's main thread.
 * Only active in development or server environments.
 */
export function setupListeners(): void {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'server'
  ) {
    figma.ui.on('message', async (msg: PluginMessage) => {
      const handler = handlers[msg.event];
      if (handler) {
        await Promise.resolve(handler(msg));
      }
    });
  }
}
