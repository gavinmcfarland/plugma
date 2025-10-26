# WebSocket Sandbox

This is a sandbox environment for testing and demonstrating the websocket features. It provides a simple setup with both a WebSocket server and client implementation.

## Installation

Install dependencies:

```bash
npm install
```

## Usage

### Start the WebSocket server

```bash
npm start server
```

### Spin up a client

To spin up a client, run the following command and replace `[client-name]` with the name of the client you want to spin up. Can be `vite`, `test`, `figma`, or `browser`.

```bash
npm start [client-name]
```

### Monitor in the console

```bash
npm run monitor
```

## Plugma websockets helpers

The `plugma` package includes a set of helpers for creating and managing websockets.

### `createClient`

#### Create a client

Create a client with a room name to join.

```ts
import { createClient } from "plugma/client";

const client = createClient({
    room: "room1",
    port: 8080,
    host: "localhost",
});
```

#### Send a message

Send message with any event name and an optional list of rooms it should send to.

```ts
client.emit("EVENT_NAME", {
    message,
    room: ["room1", "room2"],
});
```

### `createSocketServer`

#### Create a websocketserver

Create a server with cors and server options.

```ts
import { createSocketServer } from "plugma/server";

const server = createSocketServer({
    httpServer,
    cors: cors ?? {
        origin: "*",
    },
    ...serverOptions,
});
```

### Managing Port Conflicts

If you encounter the `EADDRINUSE` error (port already in use), you can kill the process using these commands:

On macOS/Linux:

```bash
npm run kill-port        # Kills process on default port 8080
PORT=3000 npm run kill-port  # Kills process on specified port
```

On Windows:

```bash
npm run kill-port:win    # Kills process on default port 8080
set PORT=3000 && npm run kill-port:win  # Kills process on specified port
```
