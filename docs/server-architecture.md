# Plugma Server Architecture

## Overview

The Plugma development server setup consists of three main components that work together to provide a seamless development experience for Figma plugin development:

1. Vite Development Server
2. WebSocket Server
3. Development UI (Dev Server App)

This document explains how these components interact and their responsibilities.

## Component Details

### 1. Vite Development Server

The Vite server is responsible for serving the plugin's UI during development. It provides:

- Hot Module Replacement (HMR)
- Static file serving
- Source map support
- Development middleware
- CORS support for Figma

Key files:
- `src/tasks/server/vite.ts`: Server implementation
- `src/utils/config/create-vite-configs.ts`: Server configuration
- `src/vite-plugins/`: Custom Vite plugins

Configuration:
~~~typescript
{
  server: {
    port: options.port,
    cors: true,
    host: 'localhost',
    strictPort: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      // ... other CORS headers
    }
  }
}
~~~

### 2. WebSocket Server

The WebSocket server handles real-time communication between:
- The plugin running in Figma
- The development UI
- The Vite development server

Key files:
- `src/tasks/server/websocket.ts`: WebSocket server implementation with automatic port assignment (Vite port + 1)

Features:
- Client tracking with unique IDs
- Message broadcasting
- Connection management
- Error recovery
- Automatic port assignment (Vite port + 1)

### 3. Development UI (Dev Server App)

The development UI provides tools and interfaces for plugin development:

- Plugin preview
- Development tools
- Status monitoring
- WebSocket connection status

Location: `apps/dev-server/`

Key files:
- `App.svelte`: Main UI component
- `main.ts`: Entry point
- `vite.config.ts`: UI-specific Vite configuration

## Server Interaction Flow

### 1. Development Startup

~~~mermaid
sequenceDiagram
    participant User
    participant Vite
    participant WS
    participant DevUI
    participant Figma

    User->>Vite: Start dev server
    Vite->>WS: Start WebSocket server
    Vite->>DevUI: Serve development UI
    DevUI->>WS: Connect to WebSocket
    Figma->>WS: Connect plugin
~~~

### 2. Development Loop

1. **UI Changes**:
   - Developer modifies UI code
   - Vite HMR updates the UI
   - Changes visible in Figma

2. **Plugin Changes**:
   - Developer modifies plugin code
   - WebSocket server notifies clients
   - Plugin reloads in Figma

3. **Development Tools**:
   - Dev UI shows connection status
   - Provides development features
   - Monitors plugin state

## Error Handling

The server architecture includes robust error handling:

1. **Vite Server**:
   - Graceful shutdown
   - Port conflict resolution
   - Build error recovery

2. **WebSocket Server**:
   - Connection error handling
   - Client disconnection management
   - Message validation

3. **Development UI**:
   - Connection retry logic
   - Error state display
   - Status monitoring

## Development Workflow

1. **Start Development**:
   ~~~bash
   npm run dev
   ~~~
   - Starts Vite server
   - Launches WebSocket server
   - Opens development UI

2. **Plugin Development**:
   - Edit plugin code
   - Changes reflect in Figma
   - Use development tools

3. **Production Build**:
   ~~~bash
   npm run build
   ~~~
   - Builds optimized plugin
   - Packages assets
   - Creates distribution files

## Best Practices

1. **Server Configuration**:
   - Use provided port or auto-assign
   - Enable CORS for Figma
   - Configure proper headers

2. **WebSocket Usage**:
   - Handle connection errors
   - Validate messages
   - Clean up connections

3. **Development**:
   - Use HMR for faster development
   - Monitor WebSocket connections
   - Check server status

## Troubleshooting

Common issues and solutions:

1. **CORS Errors**:
   - Verify Vite CORS configuration
   - Check request headers
   - Ensure proper origin handling

2. **Connection Issues**:
   - Confirm ports are available
   - Check WebSocket server status
   - Verify client connections

3. **Build Problems**:
   - Clear build cache
   - Check Vite configuration
   - Verify plugin manifest 
