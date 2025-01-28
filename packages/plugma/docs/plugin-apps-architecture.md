# A Tale of 3 Apps

## Overview

Plugma orchestrates three apps to enable modern plugin development with browser-based hot reloading while maintaining secure communication with Figma:

1. **FigmaBridge** - The secure communication bridge (formerly PluginWindow)
2. **DevServer** - The development environment host (formerly ViteApp)
3. **Plugin UI** - The user's plugin interface

## Apps Roles & Injection Points

### FigmaBridge
- **Role**: Acts as a secure bridge between Figma and the development environment
- **Injection**: Used only during development/preview (`plugma dev` or `plugma preview`)
- **Location**: Injected into `ui.html` as a wrapper around the user's Plugin UI
- **Key Responsibilities**:
  - Manages iframe containing DevServer/Plugin UI
  - Handles bi-directional message relay between:
    - Figma (parent window)
    - Plugin UI (iframe)
    - WebSocket server
  - Syncs Figma styles and classes
  - Provides developer toolbar
  - Monitors server status

### DevServer
- **Role**: Hosts the user's Plugin UI in development
- **Injection**: Only used during development/preview
- **Location**: Served by Vite dev server, loaded in FigmaBridge's iframe
- **Key Responsibilities**:
  - Provides hot module replacement (HMR)
  - Handles WebSocket communication
  - Manages developer tools state
  - Provides fallback error displays

### Plugin UI
- **Role**: The user's actual plugin interface
- **Injection**: Always present (dev, preview, and production)
- **Location**: 
  - Dev/Preview: Inside DevServer
  - Production: Direct in Figma
- **Key Responsibilities**:
  - Implements the plugin's interface
  - Handles user interactions
  - Communicates with Figma's plugin API

## Command Behavior

### Development (`plugma dev`)
- Uses FigmaBridge and DevServer
- Full development features (HMR, dev tools)
- Unminified code for better debugging
- WebSocket server optional (--ws flag)

### Preview (`plugma preview`)
- Uses FigmaBridge and DevServer
- Production-like build (minified/optimized)
- Development features still available
- WebSocket server enabled by default
- Plugin window starts minimized

### Build (`plugma build`)
- Creates final production bundle
- No FigmaBridge or DevServer included
- Direct compilation of Plugin UI
- Minified and optimized for production
- No development features

## Communication Flow

~~~
Development/Preview:
┌─────────────┐         ┌────────────────┐         ┌─────────────┐
│             │         │  FigmaBridge   │         │             │
│    Figma    │ ◄─────► │    (bridge)    │ ◄─────► │  Plugin UI  │
│             │         │                │         │             │
└─────────────┘         └────────────────┘         └─────────────┘
                              ▲
                              │
                              ▼
                        ┌─────────────┐
                        │  WebSocket  │
                        │   Server    │
                        └─────────────┘

Production (after build):
┌─────────────┐         ┌─────────────┐
│             │         │             │
│    Figma    │ ◄─────► │  Plugin UI  │
│             │         │             │
└─────────────┘         └─────────────┘
~~~

## Why Three Apps?

1. **Sandboxing & Security**
   - Figma plugins run in a highly restricted sandbox environment
   - The Plugin UI can only communicate with Figma through `postMessage` and specific APIs
   - Direct communication between a browser-based dev server and Figma is not possible

2. **Development vs Production**
   - DevServer is purely for development - it includes HMR, dev tools, and other development features
   - These development features would bloat the production bundle and potentially cause issues in Figma
   - By having FigmaBridge separate, we can strip out all development features in production

3. **Message Routing Complexity**
   - When developing in a browser, we need to simulate Figma's message passing
   - FigmaBridge acts as a "virtual Figma" in the browser, maintaining the same messaging patterns
   - This ensures the Plugin UI works the same in development as it will in production

If we tried to do everything in DevServer:
1. We'd have to include all the Figma message handling code in the production bundle
2. Development features would be harder to strip out
3. The architecture would be less flexible for future enhancements
4. We'd lose the clear separation between development environment and production code

The three-app approach gives us a clean separation of concerns:
- FigmaBridge: Handles Figma integration and message routing
- DevServer: Handles development experience and hot reloading
- Plugin UI: Focuses purely on plugin functionality

This makes the codebase more maintainable and ensures plugins work consistently in both development and production environments.

## Implementation Details

### CLI Integration
1. During `plugma dev`:
   - FigmaBridge is injected into `ui.html`
   - DevServer serves the development version of the Plugin UI
   - WebSocket server enables real-time communication

2. During `plugma build`:
   - Only essential production code is included
   - Development-specific features are stripped out

### Message Handling
- Messages flow through multiple contexts:
  1. Figma → FigmaBridge → Plugin UI
  2. Plugin UI → FigmaBridge → Figma
  3. WebSocket ↔ All Apps

### Style Synchronization
- FigmaBridge monitors Figma styles/classes
- Changes are propagated to DevServer/Plugin UI
- Ensures consistent appearance during development

## Benefits
1. **Developer Experience**
   - Hot reloading
   - Browser developer tools
   - Real-time style updates

2. **Production Ready**
   - Clean separation of concerns
   - Minimal production bundle
   - Maintained plugin functionality

3. **Flexibility**
   - Support for various UI frameworks
   - Extensible architecture
   - Framework-agnostic approach
~~~ 
