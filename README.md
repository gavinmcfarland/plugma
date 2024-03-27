# Plugma

> [!WARNING]
> This work is still in progress. Use at your own risk.

Plugma is a CLI to simplify creating Figma plugins.

### Requirements

- [Node.js](https://nodejs.org/en)
- [Figma desktop app](https://www.figma.com/downloads/)

## Get started

To get started, create a plugin from a template using:

```shell
npm create plugma@latest
```

Follow the on-screen instructions.

Currently, the only framework supported is `Svelte`.

## How does it work?

Plugma leverages Vite for building UIs across various frameworks and employs ESBuild for efficient management of the main thread. It streamlines plugin development by minimizing boilerplate code and offers seamless local development with its built-in server, making it an optimal choice for Figma plugin development due to its exceptional developer experience.

## Features

- **Live Development Server:** By linking the plugin window to a development server it eliminates the need to rebuild the UI file repeatedly. This aids in debugging and streamlines the process.

- **Browser Preview:** Since it utilises a development server, you can try out your plugin's UI on different browsers, including previewing how it looks in both Figma's dark and light themes.

- **Consistent Folder Structure:** Plugma hides unnecessary boilerplate code so you can concentrate on the code required to develop your plugins.

## Plugin Folder Structure

Your plugin project will look something like this.

Depending on which framework you choose, the files might vary slightly, but the file structure will remain the same.

```
dist/
    main.js
    ui.html
    manifest.json
scr/
    main.ts
    ui.ts
    App.jsx
    styles.css
vite.config.ts
package.json
README.md
```

- `dist` The dist folder is where the outputted plugin code is built. When importing a plugin in Figma, select the `manifest.json` file from this folder.

- `src` All of the source files required for your plugin.

  - `main.ts` This file interacts with Figma's Plugin API
  - `ui.ts` This file mounts the UI
  - `App.jsx` This file contains your UI markup (mandatory for some frameworks)

- `vite.config.ts` Because Plugma uses Vite for bundling, it gives you access to all of Vite's plugins.

- `package.json` Contains the name of our plugin and Figma manifest details in the `plugma.manifest` field.

## Configure

You need either a `manifest.json` file in the root of the project or the manifest details must be included in the `plugma.manifest` field within the `package.json` file.

```jsonc
// package.json
{
  //...

  "plugma": {
    "manifest": {
      "main": "src/main.js",
      "ui": "src/ui.js"
    }
  }
}
```
