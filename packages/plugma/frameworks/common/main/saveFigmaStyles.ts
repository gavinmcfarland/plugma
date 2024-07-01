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
        console.log("pass figma styles");
        let data = await figma.clientStorage.getAsync("figma-stylesheet");
        figma.ui.postMessage({
          event: "pass-figma-stylesheet",
          data,
        });
      }
    });
  }
}

export { saveFigmaStyles };
