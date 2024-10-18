<p align="center">
  <img width="428" alt="logos" src="https://github.com/gavinmcfarland/plugma/assets/5551/ad6f0a2d-43d5-413d-88f0-4f31374aa148">
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/plugma"><img src="https://img.shields.io/npm/v/plugma.svg"></a>
</p>

> [!WARNING]
> The next release is still in progress, but comes with a lot of improved features including better web socket handling for previewing in the browser and the ability to bundle the main code using `vite.config.js`.

# Plugma

Take Figma plugin development to the next level with browser previews, faster debuging and minimal boilerplate.

## Requirements

-   [Node.js](https://nodejs.org/en)
-   [Figma desktop app](https://www.figma.com/downloads/)

## Start from a template

Create a plugin from a template using the following:

```shell
# Use plugma@next for next releas in progress
npm create plugma@latest
```

The frameworks currently supported are `React`, `Svelte`, `Vue` and vanilla `JavaScript`.

<!-- ## Create plugin from template

```shell
npm create plugma@latest
```

Follow the on-screen instructions.

Currently, the only framework supported is `Svelte`. -->

## Commands

_When using these with npm run you need to pass the arguments with a double dash `--`, for example `npm run dev -- -p`._

<!-- ### `plugma init`

Follow the on-screen instructions to create a plugin from a template.

Currently, the only framework supported is `Svelte`. -->

-   ### dev [options]

    Start a server to develop your plugin.

    **Options**

    -   `-p`, `--port`: Specify a port number for the plugin preview.
    -   `-m`, `--mode`: Specify a mode.
    -   `-ws`, `--websockets`: Enable websockets to preview in browser.

-   ### build [options]

    Create a build before publishing.

    **Options**

    -   `-w`, `--watch`: Watch for changes and rebuild automatically.
    -   `-m`, `--mode`: Specify a mode.

-   ### preview [options]

    Preview the plugin in a browser preview.

    **Options**

    -   `-p`, `--port`: Specify a port number for the plugin preview.
    -   `-m`, `--mode`: Specify a mode.

-   ### release [version] [options]

    Build the plugin and release to GitHub.

    **Version**

    -   `alpha`, `beta`, `stable` or an integer (optional)

    **Options**

    -   `-t`, `--title`: Provide a custom title
    -   `-n`, `--notes`: Provide release notes.

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

## Further features

-   ### Developer Tools

    Plugma comes with several developer tools to make developing plugins easier. You can enable them by using keyboard shortcut <kbd>Opt + Cmd + J</kbd>.

-   ### Manifest Config

    You can either place a `manifest.json` file in the root of the project or add a `plugma.manifest` field to the `package.json` file.

-   ### Blunding Config

    Vite is used to bundle both the main code and the UI. To configure how this works you can can modify the `vite.config.js` file in the route of your project.

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

-   ### Installing globally

    If you'd prefer to use the CLI globally you can install it using the following.

    ```
    npm install plugma -g
    ```

## Troubleshooting

### Posting messages

> [!WARNING]
> This will no longer be an issue in the next version when it releases.

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

## How does Plugma work?

Plugma simplifies Figma plugin development by using Vite to bundle everything into a single file and managing the development environment with a local server. Here’s how it works:

-   Vite bundles styles and scripts into one file, and a local server is used during development, removing the need for rebuilding with every change. The plugin iframe is automatically redirected to this server.
-   Since the iframe is redirected, Plugma handles things like keyboard events, passing Figma’s CSS theme variables, and enabling browser previews via WebSockets. This all happens behind the scenes, so you don’t need to modify your plugin’s source code.
-   For the final build, only your plugin code is bundled, excluding any development boilerplate, and the code is minified.

## Acknowledgments

I would like to thank Yuan Qing Lim's [Create Figma Plugin](https://yuanqing.github.io/create-figma-plugin/) for the inspiration for this project.
