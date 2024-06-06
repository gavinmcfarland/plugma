const ws = {};
let isConnected;

function throttle(mainFunction, delay) {
  let timerFlag = null; // Variable to keep track of the timer

  // Returning a throttled version
  return (...args) => {
    if (timerFlag === null) {
      // If there is no timer currently running
      mainFunction(...args); // Execute the main function
      timerFlag = setTimeout(() => {
        // Set a timer to clear the timerFlag after the specified delay
        timerFlag = null; // Clear the timerFlag to allow the main function to be executed again
      }, delay);
    }
  };
}

function onWindowMsg(msg) {
  if (msg.data.pluginMessage) {
    const message = JSON.stringify(msg.data.pluginMessage);

    if (ws.current.readyState === 1) {
      // console.log("sent", message);
      ws.current.send(message);
    } else {
      setTimeout(() => {
        onWindowMsg(msg);
      }, 1000);
    }
  }
}

function startWebSocketServer() {
  console.log("start web socket");
  ws.current = new WebSocket("ws://localhost:9001/ws");
  ws.current.onopen = () => {
    console.log("ws opened");
    // setIsConnected(true);
    // isConnected.textContent = "Is connected";
  };
  ws.current.onclose = () => {
    console.log("ws closed");
    // setIsConnected(false);
    // isConnected.textContent = "Not connected";

    setTimeout(() => {
      startWebSocketServer();
    }, 3000);
  };

  // Throttle the event because it's causing plugin window to crash/slow down
  ws.current.onmessage = throttle((event) => {
    try {
      let msg = JSON.parse(event.data);

      // Pass messages received from Figma main to local server
      if (msg.src === "server") {
        let temp = JSON.parse(msg.message);
        window.parent.postMessage(
          {
            pluginMessage: temp,
            pluginId: "*",
          },
          "*"
        );
      }
    } catch (err) {
      console.error("not a valid message", err);
    }
    // return false;
  }, 1000);

  window.addEventListener("message", onWindowMsg);

  return () => {
    ws.current.close();
    window.removeEventListener("message", onWindowMsg);
  };
}

startWebSocketServer();

export { startWebSocketServer };
