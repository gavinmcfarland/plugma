# Plugma

> [!WARNING]
> This work is still in progress. Use at your own risk.

Plugma is a CLI to simplify creating Figma plugins.

### Requirements

- [Node.js](https://nodejs.org/en)
- [Figma desktop app](https://www.figma.com/downloads/)

### Start from plugin template

```shell
npm create plugma@latest
```

Currently, the only framework supported is `Svelte`.

## Install

```
npm install plugma
```

<!-- ## Create plugin from template

```shell
npm create plugma@latest
```

Follow the on-screen instructions.

Currently, the only framework supported is `Svelte`. -->

## Commands

<!-- ### `plugma init`

Follow the on-screen instructions to create a plugin from a template.

Currently, the only framework supported is `Svelte`. -->

### `plugma dev`

Start a development server.

#### Options

- `--websockets=off`, `-ws=off`: Turn off websockets.
- `port`, `-p`: Specify the port number for the server to run on. Default is _3000_.

### `plugma build`

Create a build ready for publishing.

#### Options

- `--watch`, `-w`: Watch for changes and rebuild automatically.

<!-- ## Plugin Folder Structure

Your plugin project will look something like this.

Depending on which framework you choose, the files might vary slightly, but the file structure will remain the same.

- `dist` The dist folder is where the outputted plugin code is built. When importing a plugin in Figma, select the `manifest.json` file from this folder.

- `src` All of the source files required for your plugin.

  - `main.ts` This file interacts with Figma's Plugin API
  - `ui.ts` This file mounts the UI
  - `App.jsx` This file contains your UI markup (mandatory for some frameworks)

- `vite.config.ts` Because Plugma uses Vite for bundling, it gives you access to all of Vite's plugins.

- `package.json` Contains the name of our plugin and Figma manifest details in the `plugma.manifest` field.

## Configure Plugma

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

## How does it work?

Plugma simplifies plugin development with Vite for UI building and ESBuild for main thread management. It streamlines coding by hiding boilerplate and enables seamless local development. Plus, it offers browser preview via WebSockets. -->

## Acknowledgments

I would like to thank Yuan Qing Lim's [Create Figma Plugin](https://yuanqing.github.io/create-figma-plugin/) for the inspiration for this project.
