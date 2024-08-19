function saveFigmaStyles() {
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "server"
  ) {
    figma.ui.on("message", async (msg) => {
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
    });
  }
}

export { saveFigmaStyles };
