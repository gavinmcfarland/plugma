# Figma Bridge

The Figma Bridge app serves as a wrapper/container for Figma plugins, providing essential managing plugin communication and state, dev server status monitoring, and developer tools.

## Responsibilities

-   **Iframe Management**: Maintains a persistent execution context that enables reliable communication between the main, iframe, browser and testing clients.
-   **Bi-directional Communication**: Relays messages between:
    -   Figma (parent window or main thread)
    -   Iframe (plugin UI)
    -   Browser client
    -   Test client
-   **Figma Styles Sync**: Monitors and syncs Figma's classes and styles to ensure plugin UI matches Figma's theme.
-   **Developer Tools**: Provides a toolbar for development when actived using keyboard shortcut.
-   **Server Status**: Monitors and displays the development server status to let the user know when the server is down.

## Architecture

### Communication Flow

```
1. Figma main ◄────► Figma Bridge ◄────► Iframe UI
2. WebSocket Server ◄────► Browser client
3. WebSocket Server ◄────► Test client
```

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

-   Style and class changes in Figma
-   Server status monitoring
-   Developer tools status
-   Window resizing
-   Message relay between different contexts

## Technical Details

-   Uses Svelte for the UI framework
-   Implements real-time bi-directional communication
-   Monitors both HTML classes and stylesheet changes
-   Provides fallback error displays for server issues
