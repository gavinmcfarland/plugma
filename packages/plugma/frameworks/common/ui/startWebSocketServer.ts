const ws = {};
let isConnected;

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

  ws.current.onmessage = (event) => {
    try {
      let msg = JSON.parse(event.data);
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
  };

  window.addEventListener("message", onWindowMsg);

  return () => {
    ws.current.close();
    window.removeEventListener("message", onWindowMsg);
  };
}

startWebSocketServer();

export { startWebSocketServer };
