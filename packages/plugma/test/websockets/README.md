# WebSocket Gateway Sandbox

This is a sandbox environment for testing and demonstrating the `websocket-gateway` package. It provides a simple setup with both a WebSocket server and client implementation.

## Setup

1. Make sure you have Node.js installed on your system
2. Install dependencies:
    ```bash
    npm install
    ```

## Running the Demo

You can run the demo in two ways:

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
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

## What's Included

-   A basic WebSocket server running on port 8080
-   A WebSocket client that connects to the server
-   Basic message handling and connection events
-   Graceful shutdown handling
-   Port management utilities

## Project Structure

```
sandbox/
├── src/
│   └── index.ts    # Main demo implementation
├── package.json    # Project dependencies and scripts
└── tsconfig.json   # TypeScript configuration
```

## Example Usage

The demo shows basic usage of the `websocket-gateway` package:

1. Creating a WebSocket server
2. Establishing a client connection
3. Sending and receiving messages
4. Handling connection events
5. Proper cleanup on shutdown

You can modify `src/index.ts` to experiment with different WebSocket functionality and test various scenarios.
