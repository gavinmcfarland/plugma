// Todo: Add check to see if url active before loading the rest of plugin main code

function saveFigmaStyles() {
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "server"
  ) {
    figma.ui.on("message", async (msg) => {
      // figma.ui.onmessage = async (msg) => {
      if (msg.event === "save-figma-stylesheet") {
        figma.clientStorage.setAsync("figma-stylesheet", msg.data);
      }
      if (msg.event === "get-figma-stylesheet") {
        let data = await figma.clientStorage.getAsync("figma-stylesheet");
        figma.ui.postMessage({
          event: "pass-figma-stylesheet",
          data,
        });
      }
      if (msg.event === "plugma-delete-file-storage") {
        let pluginDataKeys = figma.root.getPluginDataKeys();
        for (let i = 0; i < pluginDataKeys.length; i++) {
          let key = pluginDataKeys[i];
          figma.root.setPluginData(key, "");
          console.log(`Pugma: ${key} deleted from root pluginData`);
        }
        figma.notify("Root pluginData deleted");
      }
      if (msg.event === "plugma-delete-client-storage") {
        let clientStorageKeys = await figma.clientStorage.keysAsync();
        for (let i = 0; i < clientStorageKeys.length; i++) {
          let key = clientStorageKeys[i];
          if (key !== "figma-stylesheet") {
            await figma.clientStorage.deleteAsync(key);
            console.log(`Pugma: ${key} deleted from clientStorage`);
          }
        }
        figma.notify("ClientStorage deleted");
      }

      if (msg.event === "plugma-save-on-run-messages") {
        figma.clientStorage.setAsync("plugma-on-run-messages", msg.data);
      }
      if (msg.event === "plugma-get-on-run-messages") {
        let data = await figma.clientStorage.getAsync("plugma-on-run-messages");

        for (let i = 0; i < data.length; i++) {
          let msg = data[i];
          figma.ui.postMessage(msg.pluginMessage);
        }
      }
    });
  }
}

export { saveFigmaStyles };
