import { getWindowSettings } from '../utils/get-window-settings';
import { figmaApi } from './figma-api';

/**
 * Custom resize function that takes into account minimized state.
 * @param width - The desired window width
 * @param height - The desired window height
 */
export function customResize(width: number, height: number): void {
  getWindowSettings().then((pluginWindowSettings) => {
    const dimensions = {
      width,
      height,
    };

    if (pluginWindowSettings.minimized) {
      dimensions.height = 40;
      dimensions.width = 200;
    }

    figmaApi.resize(dimensions.width, dimensions.height);
  });
}
