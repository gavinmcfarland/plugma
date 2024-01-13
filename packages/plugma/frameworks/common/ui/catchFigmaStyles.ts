// FIX ME: Figure out why TS syntax doesn't work in these files

function catchFigmaStyles() {
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
      document.styleSheets[0].insertRule(message.styles);
      window.removeEventListener("message", onWindowMsg2);
    }
  };
  window.addEventListener("message", onWindowMsg2);
}

catchFigmaStyles();

export { catchFigmaStyles };
