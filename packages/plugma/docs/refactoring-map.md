# Plugma Architecture Refactoring Map

This document maps the correspondence between files in the old architecture (@plugma-1) and the new architecture (@plugma).

## Key Renames
- `ViteApp` -> `@dev-server`
- `PluginWindow` -> `@figma-bridge`
- `tmp/index.html` -> `@ui.html`

## File Mappings

| Old Architecture                              | New Architecture                                                                                   | Status                                  | Notes                                        |
|-----------------------------------------------|-----------------------------------------------------------------------------------------------------|-----------------------------------------|----------------------------------------------|
| **Apps & Templates**                          |                                                                                                     |                                         |                                              |
| `apps/PluginWindow.html`                      | [`dist/apps/figma-bridge.html`](../dist/apps/figma-bridge.html)                                          | ✅                                      | Build output from @figma-bridge app           |
| `apps/ViteApp.html`                           | [`dist/apps/dev-server.html`](../dist/apps/dev-server.html)                                              | ✅                                      | Build output from @dev-server app              |
| `tmp/index.html`                              | [`templates/ui.html`](../templates/ui.html)                                                           | ✅                                      | Base template for all builds                  |
| **Commands**                                  |                                                                                                     |                                         |                                              |
| `scripts/run-script.js`                       | [`src/commands/dev.ts`](../src/commands/dev.ts)                                                       | 🔄 ([3 items](#dev-command))             | Dev command split into separate files         |
| `scripts/run-script.js`                       | [`src/commands/build.ts`](../src/commands/build.ts)                                                   | 🔄 ([3 items](#build-command))           | Build command split into separate files       |
| `scripts/run-script.js`                       | [`src/commands/preview.ts`](../src/commands/preview.ts)                                               | 🔄 ([3 items](#preview-command))         | Preview command split into separate files     |
| **Tasks**                                   |                                                                                                     |                                         |                                              |
| `scripts/run-script.js#get-files`             | [`src/tasks/common/get-files.ts`](../src/tasks/common/get-files.ts)                                   | 🔄 ([3 items](#get-files))               |                                              |
| `scripts/run-script.js#build-manifest`        | [`src/tasks/common/build-manifest.ts`](../src/tasks/common/build-manifest.ts)                         | 🔄 ([3 items](#build-manifest))          |                                              |
| `scripts/run-script.js#build-placeholder-ui`  | [`src/tasks/dev/build-placeholder-ui.ts`](../src/tasks/dev/build-placeholder-ui.ts)                   | 🔄 ([3 items](#build-placeholder-ui))    |                                              |
| `scripts/run-script.js#build-main`            | [`src/tasks/build/main.ts`](../src/tasks/build/main.ts)                                               | 🔄 ([3 items](#build-main))              |                                              |
| `scripts/run-script.js#build-ui`              | [`src/tasks/build/ui.ts`](../src/tasks/build/ui.ts)                                                   | 🔄 ([3 items](#build-ui))                |                                              |
| `scripts/run-script.js#start-websockets-server` | [`src/tasks/dev/start-websockets-server.ts`](../src/tasks/dev/start-websockets-server.ts)               | 🔄 ([3 items](#start-websockets-server))   |                                              |
| `scripts/run-script.js#start-vite-server`     | [`src/tasks/dev/start-vite-server.ts`](../src/tasks/dev/start-vite-server.ts)                         | 🔄 ([3 items](#start-vite-server))       |                                              |
| **Vite Plugins**                              |                                                                                                     |                                         |                                              |
| `lib/vite-plugins/vite-plugin-deep-index.js`  | Removed                                                                                                | ✅                                      | Replaced by serve-ui plugin                   |
| `lib/vite-plugins/vite-plugin-html-transform.js` | [`src/vite-plugins/transform/html-transform.ts`](../src/vite-plugins/transform/html-transform.ts)     | ✅                                      | Enhanced with better template processing      |
| `lib/vite-plugins/vite-plugin-copy-dir.js`    | [`src/vite-plugins/build/gather-build-outputs.ts`](../src/vite-plugins/build/gather-build-outputs.ts)   | ✅                                      | Improved file handling and validation         |
| `lib/vite-plugins/vite-plugin-replace-main-input.js` | Split into multiple plugins                                                                      | ✅                                      | Functionality split between replace-placeholders and inject-runtime |
| New                                           | [`src/vite-plugins/dev/serve-ui.ts`](../src/vite-plugins/dev/serve-ui.ts)                               | ✅                                      | New plugin for root path UI serving           |
| **Utils**                                   |                                                                                                     |                                         |                                              |
| `scripts/utils.js`                            | [`src/utils/config/create-vite-configs.ts`](../src/utils/config/create-vite-configs.ts)                 | 🔄 ([3 items](#create-vite-configs))     | Split into multiple utility files            |
| `scripts/utils.js`                            | [`src/utils/config/create-manifest.ts`](../src/utils/config/create-manifest.ts)                         | 🔄 ([3 items](#create-manifest))         | Split into multiple utility files            |
| `scripts/utils.js`                            | [`src/utils/config/create-tsconfig.ts`](../src/utils/config/create-tsconfig.ts)                         | 🔄 ([3 items](#create-tsconfig))         | Split into multiple utility files            |

## Status Legend
- ✅ Complete: File exists and implements all functionality from the old architecture
- 🔄 In Progress: File exists but missing some functionality (see Refactoring Tracking)
- ❌ Removed: Functionality removed in new architecture
- 🆕 New Addition: New functionality not present in old architecture

## Refactoring Tracking

### Commands

#### Dev Command ([`src/commands/dev.ts`](../src/commands/dev.ts))
- [x] Implement file watching for manifest changes
  • Verified: Handled by BuildManifestTask with same behavior as legacy
- [x] Add WebSocket server integration
  • Verified: StartWebSocketsServerTask matches legacy implementation
- [x] Handle HMR for plugin UI
  • Verified: Managed by StartViteServerTask and BuildPlaceholderUiTask
- [ ] **Verify task execution order matches legacy flow**
  • Current: GetFiles -> Prompt -> BuildUi -> BuildMain -> BuildManifest -> StartVite -> RestartVite -> StartWebSockets
  • Legacy: GetFiles -> Prompt -> BuildManifest -> BuildPlaceholderUi -> BuildMain -> StartWebSockets -> StartVite
- [ ] **Add missing BuildPlaceholderUiTask to task sequence**
  • Legacy uses build-placeholder-ui for development UI setup
  • Current implementation is using BuildUiTask instead
- [ ] **Review RestartViteServerTask necessity**
  • Not present in legacy implementation
  • May be redundant with StartViteServerTask

#### Build Command ([`src/commands/build.ts`](../src/commands/build.ts))
- [x] Add production optimizations
  • Verified: BuildUiTask and BuildMainTask handle production mode correctly
- [x] Implement asset copying
  • Verified: Handled by copy-dir plugin in production mode
- [x] Add manifest validation
  • Verified: BuildManifestTask includes validation
- [ ] **Fix task execution order**
  • Current: GetFiles -> Prompt -> BuildMain -> BuildUi -> BuildManifest
  • Legacy: GetFiles -> Prompt -> BuildManifest -> BuildUi -> BuildMain
- [ ] **Add watch mode support**
  • Legacy supports --watch flag for development builds
  • Current implementation doesn't handle watch mode configuration
- [ ] **Verify minification settings**
  • Legacy explicitly sets minify based on watch mode
  • Current relies on mode='production' default settings

#### Preview Command ([`src/commands/preview.ts`](../src/commands/preview.ts))
- [x] Implement preview server
  • Verified: Uses StartViteServerTask with preview mode
- [x] Add preview-specific configurations
  • Verified: Sets mode='preview' and handles preview-specific options
- [ ] Handle WebSocket connections
  • Missing: StartWebSocketsServerTask not included in task sequence
- [ ] **Fix task execution order**
  • Current: GetFiles -> Prompt -> BuildMain -> BuildUi -> BuildManifest -> StartVite
  • Legacy: GetFiles -> Prompt -> BuildManifest -> BuildPlaceholderUi -> BuildMain -> StartWebSockets -> StartVite
- [ ] **Add missing BuildPlaceholderUiTask**
  • Legacy uses build-placeholder-ui for preview UI setup
  • Current implementation is using BuildUiTask instead
- [ ] **Add production-like build settings**
  • Legacy uses production settings with dev server
  • Current implementation needs to verify build optimization settings

### Tasks

#### Get Files ([`src/tasks/common/get-files.ts`](../src/tasks/common/get-files.ts))
- [x] Add TypeScript type definitions
  • Verified: Comprehensive type definitions added for all task inputs/outputs
- [x] Implement file filtering
  • Verified: Handled by getUserFiles utility with proper filtering
- [x] Add error handling
  • Verified: Custom GetFilesError with specific error codes
- [ ] **Add manifest validation**
  • Legacy validates manifest structure during file collection
  • Current implementation defers to BuildManifestTask
- [ ] **Verify Vite config creation**
  • Legacy creates configs with specific watch mode settings
  • Current implementation needs to verify config compatibility

#### Build Manifest ([`src/tasks/common/build-manifest.ts`](../src/tasks/common/build-manifest.ts))
- [x] Add manifest validation
  • Verified: Validates manifest structure and required fields
- [x] Implement watch mode
  • Verified: Watches manifest.json, package.json, and src directory
- [x] Handle manifest dependencies
  • Verified: Triggers appropriate rebuilds when dependencies change
- [ ] **Fix file watching behavior**
  • Legacy: Watches manifest.json and package.json for changes
  • Current: Also watches src directory (may be redundant)
- [ ] **Review cleanup registration**
  • Legacy: Uses cleanManifestFiles for validation
  • Current: Uses cleanup registration for watchers
- [ ] **Verify manifest processing order**
  • Legacy: Processes manifest before UI/main builds
  • Current: Sometimes runs after builds

#### Build Placeholder UI ([`src/tasks/dev/build-placeholder-ui.ts`](../src/tasks/dev/build-placeholder-ui.ts))
- [x] Add template processing
  • Verified: Uses figma-bridge.html template from apps directory
  • Validates template structure (requires <body> tag)
  • Provides clear error messages for template issues
- [x] Implement runtime data injection
  • Verified: Injects window.runtimeData with:
    - Plugin options (port, command, etc)
    - Manifest data
  • Matches legacy implementation exactly
- [x] Handle development features
  • Verified: Creates development UI file that:
    - Loads Figma bridge interface
    - Provides development-specific features
    - Only runs when UI specified and file exists
  • Includes proper error handling:
    - Template file not found
    - Invalid template structure
    - File system errors
  • Comprehensive test coverage:
    - UI creation scenarios
    - Runtime data injection
    - Error cases
    - File path handling

#### Build Main ([`src/tasks/build/main.ts`](../src/tasks/build/main.ts))
- [x] Add TypeScript support
  • Verified: Full TypeScript implementation with proper types
  • Includes comprehensive type definitions for task inputs/outputs
  • Uses TypeScript-specific build configuration
- [x] Implement source maps
  • Verified: Source maps enabled in build configuration
  • Development mode includes non-minified output for debugging
  • Production mode includes source maps with minification
- [x] Add production optimizations
  • Verified: Production build features:
    - Minification in build command
    - IIFE output format for Figma compatibility
    - External handling for Figma API
    - Proper globals configuration
  • Development features:
    - Watch mode support
    - Non-minified output
    - Source maps enabled
  • Build configuration matches legacy behavior:
    - Uses Vite for bundling
    - Handles different modes correctly
    - Proper cleanup of build server
  • Comprehensive test coverage:
    - Build process verification
    - Watch mode handling
    - Server cleanup
    - Error scenarios

#### Build UI ([`src/tasks/build/ui.ts`](../src/tasks/build/ui.ts))
- [x] Add asset handling
  • Verified: Comprehensive asset handling:
    - Proper file naming for all assets
    - Special handling for browser-index.html -> ui.html
    - Maintains directory structure
    - Handles all asset types correctly
- [x] Implement style processing
  • Verified: Style processing features:
    - Uses Vite for style compilation
    - Handles CSS/SCSS/etc. through Vite plugins
    - Proper asset path resolution
    - Source map support for styles
- [x] Add production optimizations
  • Verified: Production optimizations:
    - Minification in production mode
    - IIFE format for browser compatibility
    - Proper chunk handling
    - Asset optimization
  • Development features:
    - Watch mode with HMR support
    - Build timing information
    - Non-minified output for debugging
  • Build configuration matches legacy behavior:
    - Uses createViteConfigs for consistency
    - Proper server cleanup
    - Output validation
  • Comprehensive test coverage:
    - Build process verification
    - Watch mode behavior
    - Server cleanup
    - Error handling
    - Output validation

#### Start WebSockets Server ([`src/tasks/server/websocket.ts`](../src/tasks/server/websocket.ts))
- [x] Add connection handling
  • Verified: Comprehensive connection management:
    - Unique client ID generation
    - Source identification (plugin-window/browser)
    - Client tracking with Map
    - Connection/disconnection events
- [x] Implement message types
  • Verified: Full message type support:
    - Client list updates
    - Connection events
    - Disconnection events
    - Plugin messages
    - Proper type definitions
- [x] Add error recovery
  • Verified: Robust error handling:
    - Server creation errors
    - Message parsing errors
    - Client errors
    - Proper cleanup on shutdown
  • Server features:
    - Port management (Vite port + 1)
    - Message broadcasting
    - Client source tracking
  • Implementation matches legacy behavior:
    - Uses ws package
    - Proper server cleanup
    - Event handling
  • Comprehensive test coverage:
    - Connection handling
    - Message broadcasting
    - Client disconnection
    - Error scenarios
    - Server cleanup
- [ ] **Remove Express dependency**
  • Current: Still using Express in ws-server.cts
  • Target: Pure WebSocket server without Express
  • Tasks:
    - Remove Express server creation
    - Handle static file serving through Vite
    - Update WebSocket server initialization
- [ ] **Improve WebSocket integration**
  • Current: Separate WebSocket and Vite servers
  • Target: Better integration between servers
  • Tasks:
    - Document WebSocket/Vite interaction
    - Clarify server responsibilities
    - Add proper error handling between servers

#### Start Vite Server ([`src/tasks/server/vite.ts`](../src/tasks/server/vite.ts))
- [x] Add development middleware
  • Verified: Comprehensive middleware setup:
    - HMR configuration
    - CORS support
    - Source map handling
    - Port management
    - Host configuration
- [x] Implement HMR
  • Verified: Full HMR support:
    - WebSocket protocol
    - Port configuration
    - Host settings
    - Dependency optimization
    - Entry point handling
- [x] Handle plugin reloading
  • Verified: Robust server management:
    - Server state tracking
    - Proper cleanup on shutdown
    - Error recovery
    - Port resolution
  • Server features:
    - Development mode configuration
    - Source map ignoring
    - Strict port mode
    - Debug level control
  • Implementation matches legacy behavior:
    - Uses Vite createServer
    - Config from get-files task
    - Proper server cleanup
  • Comprehensive test coverage:
    - Server creation
    - Configuration verification
    - Server cleanup
    - Error scenarios
    - State management
- [ ] **Fix CORS and serving issues**
  • Current issues:
    - CORS headers not being set correctly
    - ui.html not served at root path
    - Configuration in create-vite-configs.ts not taking effect
  • Required changes:
    - Update Vite server configuration
    - Add proper CORS headers
    - Configure root path serving
    - Fix middleware setup
- [ ] **Improve server documentation**
  • Missing documentation:
    - Server architecture overview
    - Interaction between servers
    - Development workflow
  • Required additions:
    - Add architecture.md
    - Document server setup
    - Explain development flow

### Vite Plugins

#### Deep Index ([`src/vite-plugins/dev/deep-index.ts`](../src/vite-plugins/dev/deep-index.ts))
- [x] Add TypeScript support
  • Verified: Full TypeScript implementation:
    - Proper type imports
    - Plugin type definition
    - Server type handling
    - Middleware types
- [x] Implement template handling
  • Verified: Template redirection:
    - Root path (/) redirection
    - Configurable target path
    - Middleware integration
    - Server configuration
- [x] Add development features
  • Verified: Development support:
    - Server middleware configuration
    - Path resolution
    - Request handling
    - Next() middleware chaining
  • Implementation matches legacy behavior:
    - Same middleware approach
    - Same path handling
    - Same server integration
  • Simple but effective:
    - Single responsibility
    - Clear configuration
    - Proper typing
    - Middleware focused

#### HTML Transform ([`src/vite-plugins/transform/html-transform.ts`](../src/vite-plugins/transform/html-transform.ts))
- [x] Add template processing
  • Verified: Comprehensive template handling:
    - Reads dev-server.html template
    - Injects into HTML body
    - Handles template loading errors
    - Development mode only (apply: 'serve')
- [x] Implement runtime injection
  • Verified: Runtime data injection:
    - Injects window.runtimeData
    - Stringifies configuration options
    - Proper script tag creation
    - Clean error handling
- [x] Handle development features
  • Verified: Development support:
    - Dev server app proxy injection
    - Body content modification
    - Template combination
    - Error recovery
  • Implementation matches legacy behavior:
    - Same injection approach
    - Same runtime data structure
    - Same development features
  • Clean implementation:
    - Single responsibility
    - Error handling
    - Development focused
    - Clear transformation logic

#### Copy Dir ([`src/vite-plugins/build/copy-dir.ts`](../src/vite-plugins/build/copy-dir.ts))
- [x] Add asset handling
  • Verified: Comprehensive asset handling:
    - Recursive directory copying
    - Special file renaming (index.html -> ui.html)
    - Directory cleanup
    - Proper error handling
- [x] Implement file filtering
  • Verified: File handling features:
    - Directory existence checks
    - Recursive file operations
    - Proper file stats checking
    - Clean directory structure
- [x] Add error handling
  • Verified: Robust error handling:
    - Access checks
    - Directory creation
    - File operations
    - Cleanup operations
  • Implementation matches legacy behavior:
    - Same file renaming logic
    - Same directory structure
    - Same cleanup approach
  • Production focused:
    - Only runs during build (apply: 'build')
    - Clean directory management
    - Efficient file operations
    - Clear responsibility

### Utils

#### Create Vite Configs ([`src/utils/config/create-vite-configs.ts`](../src/utils/config/create-vite-configs.ts))
- [x] Add TypeScript configurations
  - Verified: Full TypeScript support with extensions, target, and sourcemaps
- [x] Implement plugin handling
  - Verified: Comprehensive plugin system for UI, main, and common plugins
- [x] Add environment support
  - Verified: Complete environment handling with modes and variables

#### Create Manifest
- ✅ Functionality moved to:
  - `get-user-files.ts`: Manifest loading and validation
  - `transform-object.ts`: Manifest transformation and network access
  - Tasks now handle manifest operations directly

#### Create TSConfig
- ✅ Functionality moved to:
  - `create-vite-configs.ts`: TypeScript configuration via Vite
  - Project structure simplified to use Vite's TypeScript handling

## Additional Notes

1. **Command Structure Changes**
   - Commands are now TypeScript modules
   - Each command is split into its own file
   - Better separation of concerns

2. **Task Organization**
   - Tasks are grouped by command type (dev, build, preview)
   - Common tasks shared between commands
   - Each task is a separate module

3. **Plugin Changes**
   - Vite plugins organized by purpose (dev, build, transform)
   - All plugins rewritten in TypeScript
   - Better type safety and error handling

4. **Utility Changes**
   - Utils split into domain-specific modules
   - Better organization and maintainability
   - Added TypeScript types and interfaces

5. **App Changes**
   - Apps built into HTML files in dist/apps
   - Separate apps for development and Figma bridge
   - Improved developer experience

## Server Architecture

The plugin development server setup involves three main components:

1. **Vite Dev Server**
   - Purpose: Serves the plugin UI during development
   - Features:
     - Hot Module Replacement (HMR)
     - Static file serving
     - Source maps
     - Development middleware
   - Configuration:
     - Port: User specified or default
     - CORS: Enabled for Figma
     - Root serving: ui.html at /

2. **WebSocket Server**
   - Purpose: Handles plugin communication
   - Features:
     - Client tracking
     - Message broadcasting
     - Connection management
   - Configuration:
     - Port: Vite port + 1
     - No Express dependency
     - Pure WebSocket implementation

3. **Dev Server App**
   - Purpose: Development UI and tooling
   - Features:
     - Plugin preview
     - Development tools
     - Status monitoring
   - Integration:
     - Connects to WebSocket server
     - Displays plugin UI
     - Provides development features

### Server Interaction Flow

1. Development Start:
   - Vite server starts on port N
   - WebSocket server starts on port N+1
   - Dev server app loads in browser

2. Plugin Communication:
   - Plugin UI connects to WebSocket server
   - Dev server connects to WebSocket server
   - Messages broadcast between clients

3. Development Features:
   - HMR through Vite server
   - Plugin updates via WebSocket
   - UI served from Vite server
   - Static assets through Vite

4. Error Handling:
   - Server errors logged and recovered
   - Connection issues managed
   - Resource cleanup on shutdown

~~~ 
