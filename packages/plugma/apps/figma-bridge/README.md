# Plugin Window App

The Plugin Window app serves as a wrapper/container for Figma plugins, providing essential functionality for plugin-Figma communication, developer tools, and server status monitoring.

## Core Features

- **Iframe Management**: Hosts the plugin's UI in an iframe, handling URL monitoring and redirects
- **Bi-directional Communication**: Relays messages between:
  - Figma (parent window)
  - Plugin UI (iframe)
  - WebSocket server
- **Figma Styles Sync**: Monitors and syncs Figma's classes and styles to ensure UI consistency
- **Developer Tools**: Provides a toolbar for development when developer tools are active
- **Server Status**: Monitors and displays the development server status

## Architecture

### Communication Flow

~~~
┌─────────────┐         ┌────────────────┐         ┌─────────────┐
│             │         │ Plugin Window  │         │             │
│    Figma    │ ◄─────► │   (wrapper)    │ ◄─────► │  Plugin UI  │
│             │         │                │         │             │
└─────────────┘         └────────────────┘         └─────────────┘
                              ▲
                              │
                              ▼
                        ┌─────────────┐
                        │  WebSocket  │
                        │   Server    │
                        └─────────────┘
~~~

### Key Components

1. **WebSocket Setup**
   - Establishes communication channels between all parties
   - Handles message routing and relay

2. **Figma Integration**
   - Syncs Figma's classes and styles
   - Monitors style changes and propagates updates
   - Handles Figma-specific window management

3. **Development Features**
   - Developer toolbar (when dev tools are active)
   - Server status monitoring
   - Error reporting for localhost issues

### Event Handling

The app implements several observers and event handlers:
- Style and class changes in Figma
- Server status monitoring
- Developer tools status
- Window resizing
- Message relay between different contexts

## Technical Details

- Uses Svelte for the UI framework
- Implements real-time bi-directional communication
- Monitors both HTML classes and stylesheet changes
- Provides fallback error displays for server issues
