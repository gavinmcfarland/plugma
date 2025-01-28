# DevServer

The main application component that handles communication between Figma and the plugin's UI, manages WebSocket connections, and handles various UI states.

## App.svelte

The main component that orchestrates the plugin's functionality. Here's what it does:

### Core Features

1. **Figma Integration**
   - Detects if running inside Figma or an iframe
   - Handles Figma-specific keyboard shortcuts (⌘P for plugin re-run)
   - Manages Figma styles and class synchronization

2. **WebSocket Communication**
   - Sets up bidirectional communication between plugin UI and server
   - Maintains connection status and handles reconnection
   - Intercepts and relays messages when running outside Figma

3. **Message Handling**
   - Implements custom message event handling
   - Manages postMessage interception for non-Figma environments
   - Maintains style synchronization between Figma and plugin UI

4. **UI State Management**
   - Shows connection status when not in Figma
   - Handles developer tools integration
   - Manages toolbar visibility

### Technical Details

- Uses Svelte for reactivity and component management
- Implements WebSocket connection monitoring
- Stores Figma styles in localStorage for persistence across reloads
- Provides fallback behavior when running outside Figma

### States & Conditions

The component handles several states:

- WebSocket server connection status
- Figma connection status
- Developer tools status
- Plugin window client connections

### Environment Detection

Automatically detects and adapts behavior based on:

- Whether it's running inside Figma
- Whether it's running in an iframe
- WebSocket availability
- Server connection status
