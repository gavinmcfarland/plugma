<p align="center">
  <img width="428" alt="logos" src="https://github.com/gavinmcfarland/plugma/assets/5551/ad6f0a2d-43d5-413d-88f0-4f31374aa148">
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/plugma"><img src="https://img.shields.io/npm/v/plugma.svg"></a>
</p>

# Plugma

> [!WARNING]
> Plugma is currently in alpha. Your feedback is greatly appreciated!

Plugma simplifies Figma plugin development.

## Start from a template

Create a plugin from a template using the following:

```shell
npm create plugma@latest
```

#### Requirements

-   [Node.js](https://nodejs.org/en)
-   [Figma desktop app](https://www.figma.com/downloads/)

The frameworks currently supported are `React`, `Svelte`, `Vue` and vanilla `JavaScript`.

## Install

To install the CLI globally.

```
npm install plugma -g
```

<!-- ## Create plugin from template

```shell
npm create plugma@latest
```

Follow the on-screen instructions.

Currently, the only framework supported is `Svelte`. -->

## Commands

_When using these with npm scripts you need to pass the arguments with `--`, for example `node run dev -- -p`._

<!-- ### `plugma init`

Follow the on-screen instructions to create a plugin from a template.

Currently, the only framework supported is `Svelte`. -->

-   ### plugma dev

    Start a server to develop your plugin.

    **Options**

    -   `--port`, `-p`: Specify a port number for the plugin preview.
    -   `--toolbar`, `-t`: Show the developer toolbar within the plugin UI.
    -   `--mode`, `-m`: Specify the mode (development, production, test).

-   ### plugma build

    Create a build before publishing.

    **Options**

    -   `--watch`, `-w`: Watch for changes and rebuild automatically.
    -   `--mode`, `-m`: Specify the mode (development, production, test).

-   ### plugma release

    Build the plugin and release to github.

    **Options**

    -   `--version`, `-v`: Specify the version (alpha, beta, stable, or a whole integer).

<!-- ## Folder structure

Depending on which framework you choose, the files might vary slightly, but the file structure will remain the same.

- `dist` The dist folder is where the outputted plugin code is built. When importing a plugin in Figma, select the `manifest.json` file from this folder.

- `src` All of the source files required for your plugin.

  - `src/main.ts` This file interacts with Figma's Plugin API
  - `src/ui.ts` This file mounts the UI
  - `src/App.jsx` This file contains your UI markup (mandatory for some frameworks)

- `vite.config.ts` Because Plugma uses Vite for bundling, it gives you access to all of Vite's plugins.

- `package.json` Contains the name of our plugin and Figma manifest details in the `plugma.manifest` field. -->

<!-- ## Plugin Folder Structure

Your plugin project will look something like this.

Depending on which framework you choose, the files might vary slightly, but the file structure will remain the same.

- `dist` The dist folder is where the outputted plugin code is built. When importing a plugin in Figma, select the `manifest.json` file from this folder.

- `src` All of the source files required for your plugin.

  - `main.ts` This file interacts with Figma's Plugin API
  - `ui.ts` This file mounts the UI
  - `App.jsx` This file contains your UI markup (mandatory for some frameworks)

- `vite.config.ts` Because Plugma uses Vite for bundling, it gives you access to all of Vite's plugins.

- `package.json` Contains the name of our plugin and Figma manifest details in the `plugma.manifest` field. -->

## Manifest

You can either place a `manifest.json` file in the root of the project or add a `plugma.manifest` field to the `package.json` file.

<!-- ```jsonc
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
``` -->

## Troubleshooting

### Posting messages

You may see the following warning.

```shell
Message from plugin UI ignored due to missing pluginId in message.
```

This occurs because Plugma redirects the plugin UI to a local dev server during development. Figma needs a `pluginId` in messages from the plugin UI when coming from an external URL.

To fix this, use a wildcard as the `pluginId` in your message:

```js
// ui
parent.postmessage({
    {
        pluginMessage: "Your message",
        pluginId: "*"
    },
    "*"
})
```

## How does it work?

Plugma uses Vite to bundle Figma plugins and is configured to inline all styles and scripts into one file. It uses a local server for development, that passes messages from Figma's main thread to the local server using web sockets.

## Acknowledgments

I would like to thank Yuan Qing Lim's [Create Figma Plugin](https://yuanqing.github.io/create-figma-plugin/) for the inspiration for this project.
