// Implement own select all

// // Flag to control whether the default action is allowed
// let allowDefault = true;

// // Your custom event listener
// document.addEventListener("keydown", function (event) {
//   if ((event.ctrlKey || event.metaKey) && event.key === "a") {
//     if (allowDefault) {
//       // Custom behavior: Select all text in input/textarea
//       const activeElement = document.activeElement;
//       if (
//         activeElement &&
//         (activeElement.tagName === "INPUT" ||
//           activeElement.tagName === "TEXTAREA")
//       ) {
//         activeElement.select();
//       }
//     }
//     // Allow or prevent further action based on flag
//     if (!allowDefault) {
//       event.preventDefault();
//       console.log("Custom behavior: prevented default action");
//     }
//   }

//   if (
//     (event.metaKey || event.ctrlKey) &&
//     event.altKey &&
//     (event.key === "π" || event.key === "p")
//   ) {
//     parent.postMessage("$INTERNAL_DO_NOT_USE$RERUN_PLUGIN$", "*");

//     // Allow or prevent further action based on flag
//     if (!allowDefault) {
//       event.preventDefault();
//       console.log("Custom behavior: prevented default action");
//     }
//   }
// });

// // TODO: Think of a way that this can be exposed to consumers
// // Function to control whether the default action should be allowed
// function setAllowDefault(flag) {
//   allowDefault = flag;
// }

// // Example: User wants to override the default behavior
// setAllowDefault(false);

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

  // // When plugin loads, get messages that were sent before url was hosted
  // parent.postMessage(
  //   {
  //     pluginMessage: {
  //       event: "plugma-get-on-run-messages",
  //     },
  //     pluginId: "*",
  //   },
  //   "*"
  // );

  const onWindowMsg2 = (msg) => {
    // We listen for message to add figma styles during development
    const message = msg.data.pluginMessage;

    if (message && message.event === "pass-figma-stylesheet") {
      //   document.styleSheets[0].insertRule(message.styles);
      console.log(document);

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

      //   window.removeEventListener("message", onWindowMsg2);
    }
    // if (message && message.event === "pass-on-run-messages") {
    // }
  };
  window.addEventListener("message", onWindowMsg2);
}

catchFigmaStyles();

export { catchFigmaStyles };
