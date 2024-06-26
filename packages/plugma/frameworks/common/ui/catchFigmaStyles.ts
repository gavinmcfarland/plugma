// FIX ME: Figure out why TS syntax doesn't work in these files

function catchFigmaStyles() {
  console.log("catch figma styles");
  parent.postMessage(
    {
      pluginMessage: {
        event: "get-figma-stylesheet",
      },
      pluginId: "*",
    },
    "*"
  );

  const onWindowMsg2 = (msg) => {
    // We listen for message to add figma styles during development
    const message = msg.data.pluginMessage;
    if (message && message.event === "pass-figma-stylesheet") {
      document.styleSheets[0].insertRule(message.data.styles);
      const pluginFrame = document.documentElement;
      console.log("pluginFrame", pluginFrame);
      if (pluginFrame) {
        pluginFrame.className = message.data.classes;
        console.log(message.data);
      }

      window.removeEventListener("message", onWindowMsg2);
    }
  };
  window.addEventListener("message", onWindowMsg2);
}

catchFigmaStyles();

export { catchFigmaStyles };
