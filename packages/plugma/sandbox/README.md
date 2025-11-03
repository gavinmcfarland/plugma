# Sandbox

A simple Figma plugin that demonstrates how to send messages between the plugin’s UI and the main thread, using a basic rectangle creation example.

## Quickstart

This plugin was created with [Plugma](https://github.com/gavinmcfarland/plugma) using the [React](https://react.dev/) framework.

### Requirements

- [Node.js](https://nodejs.org/en)
- [Figma desktop app](https://www.figma.com/downloads/)

### Develop and Import

1. Install dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

   Changes are automatically rebuilt to `dist/` on save.

2. In the Figma desktop app:
   - Open a file.
   - Press `Cmd/Ctrl + K` to open the [Actions menu](https://help.figma.com/hc/en-us/articles/23570416033943-Use-the-actions-menu-in-Figma-Design).
   - Search for **“Import plugin from manifest…”**
   - Select `dist/manifest.json`.

After importing, open the Actions menu again to find and run your plugin.
Keep the dev server running for instant reloads while testing in Figma.

Edit `./manifest.json` in the project root to update your plugin details.

### Before Publishing

When your plugin is ready to publish, create a production build.
This optimizes and minifies your code, and ensures the output no longer points to the dev server.

```bash
npm run build
```

The build in `dist/` is now ready to upload via the Figma desktop app.

### Integrations

Add integrations to extend your plugin with common tools and frameworks.

```bash
npm create plugma@latest add
```

### Advanced

See the [Plugma docs](https://plugma.dev/docs) for more information.
