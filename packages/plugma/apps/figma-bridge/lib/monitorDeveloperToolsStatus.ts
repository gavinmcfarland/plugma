import {
  isDeveloperToolsActive,
  pluginWindowSettings,
} from '../../shared/stores';

export async function monitorDeveloperToolsStatus() {
  return new Promise((resolve) => {
    window.addEventListener('message', async (event) => {
      const message = event.data?.pluginMessage;

      if (message?.event === 'PLUGMA_PLUGIN_WINDOW_SETTINGS') {
        pluginWindowSettings.set(message.data);
        isDeveloperToolsActive.set(message.data.toolbarEnabled);
        resolve(true);
      }
    });
  });
}
