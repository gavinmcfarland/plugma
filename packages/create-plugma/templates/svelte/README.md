# <%- name %>

## Quickstart

This plugin was created using [Plugma](https://github.com/gavinmcfarland/plugma).

### Requirements

- [Node.js](https://nodejs.org/en)
- [Figma desktop app](https://www.figma.com/downloads/)

### Develop

1. Install the dependencies and watch for changes while developing

   ```shell
   npm install
   npm run dev
   ```

2. Open the Figma desktop app and open a new file
3. Search for "Import plugin from manifest..." using the [Quick Actions](https://help.figma.com/hc/en-us/articles/360040328653-Use-shortcuts-and-quick-actions#Use_quick_actions) bar.
4. Choose the `manifest.json` file from the `dist` folder that was generated from the `dev` command.

### Preview

Open [http://localhost:{port}](http://localhost:3000) to preview your plugin in different browsers.

Make sure the plugin is open in the Figma desktop app.

### Publish

Before publishing, make sure to create a build:

```
npm run build
```

Now you can publish the plugin from the Figma desktop app.
