import type { PlugmaRuntimeData, ShowUIOptions } from '../types';
import { getCommandHistory } from '../utils/get-command-history';
import {
  DEFAULT_WINDOW_SETTINGS,
  getWindowSettings,
} from '../utils/get-window-settings';
import { figmaApi } from './figma-api';

declare const runtimeData: PlugmaRuntimeData;

/**
 * Enhanced showUI function with support for window settings persistence and positioning.
 * @param htmlString - The HTML content to display in the plugin window
 * @param initialOptions - Configuration options for the plugin window
 */
export function customShowUI(
  htmlString: string,
  initialOptions?: ShowUIOptions,
): void {
  const options = { ...initialOptions };

  // Show UI to receive messages
  const mergedOptions = { visible: false, ...options };
  figmaApi.showUI(htmlString, mergedOptions);

  getCommandHistory().then((commandHistory) => {
    getWindowSettings(DEFAULT_WINDOW_SETTINGS[options.comm]).then(
      (pluginWindowSettings) => {
        const hasCommandChanged =
          commandHistory.previousCommand !== runtimeData.command;
        const hasInstanceChanged =
          commandHistory.previousInstanceId !== runtimeData.instanceId;

        if (runtimeData.command === 'preview') {
          pluginWindowSettings.minimized = true;
          pluginWindowSettings.toolbarEnabled = true;

          const zoom = figma.viewport.zoom;
          options.position = {
            x: figma.viewport.bounds.x + 12 / zoom,
            y:
              figma.viewport.bounds.y +
              (figma.viewport.bounds.height - (80 + 12) / zoom),
          };
        }

        if (hasCommandChanged && runtimeData.command === 'dev') {
          const zoom = figma.viewport.zoom;

          if (!options.position) {
            options.position = {
              x: figma.viewport.center.x - (options.width || 300) / 2 / zoom,
              y:
                figma.viewport.center.y -
                ((options.height || 200) + 41) / 2 / zoom,
            };
          }
        }

        if (hasInstanceChanged && runtimeData.command === 'preview') {
          pluginWindowSettings.toolbarEnabled = true;
          pluginWindowSettings.minimized = true;
        }

        if (options.height) {
          pluginWindowSettings.height = options.height;
        }

        if (options.width) {
          pluginWindowSettings.width = options.width;
        }

        if (pluginWindowSettings.toolbarEnabled && options.height) {
          options.height += 41; // Add toolbar height
        }

        if (pluginWindowSettings.minimized) {
          options.height = 40;
          options.width = 200;
        }

        // Apply window dimensions
        if (options.width && options.height) {
          figmaApi.resize(options.width, options.height);
        } else if (pluginWindowSettings.toolbarEnabled) {
          figmaApi.resize(300, 241); // 200 + 41 for toolbar
        } else {
          figmaApi.resize(300, 200);
        }

        // Apply window position
        if (options.position?.x != null && options.position?.y != null) {
          figmaApi.reposition(options.position.x, options.position.y);
        }

        // Notify UI of window settings
        figma.ui.postMessage({
          event: 'PLUGMA_PLUGIN_WINDOW_SETTINGS',
          data: pluginWindowSettings,
        });

        // Show UI unless explicitly set to false
        if (options.visible !== false) {
          figma.ui.show();
        }
      },
    );
  });
}
