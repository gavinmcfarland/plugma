// FIX ME: Figure out why TS syntax doesn't work in these files

function catchFigmaStyles() {
  // When plugin loads, get styles that were sent before url was hosted
  parent.postMessage(
    {
      pluginMessage: {
        event: "get-figma-stylesheet",
      },
      pluginId: "*",
    },
    "*"
  );

  // When plugin loads, get messages that were sent before url was hosted
  parent.postMessage(
    {
      pluginMessage: {
        event: "plugma-get-on-run-messages",
      },
      pluginId: "*",
    },
    "*"
  );

  const onWindowMsg2 = (msg) => {
    // We listen for message to add figma styles during development
    const message = msg.data.pluginMessage;

    if (message && message.event === "pass-figma-stylesheet") {
      //   document.styleSheets[0].insertRule(message.styles);

      const styleSheet = document.createElement("style");
      styleSheet.type = "text/css";
      styleSheet.innerText = message.data.styles;

      // Append the style tag to the head
      document.head.appendChild(styleSheet);

      // Add classes from Figma
      const pluginFrame = document.documentElement;

      if (pluginFrame) {
        pluginFrame.className = message.data.classes;
      }

      window.removeEventListener("message", onWindowMsg2);
    }
    // if (message && message.event === "pass-on-run-messages") {
    // }
  };
  window.addEventListener("message", onWindowMsg2);
}

catchFigmaStyles();

export { catchFigmaStyles };
