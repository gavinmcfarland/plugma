# plugma-sandbox

## Quickstart

This plugin was created with [Plugma](https://github.com/gavinmcfarland/plugma) using the [Svelte](https://svelte.dev/) framework.

### Requirements

- [Node.js](https://nodejs.org/en)
- [Figma desktop app](https://www.figma.com/downloads/)

### Install and Import

1. Install the dependencies and watch for changes while developing:

    ```bash
    pnpm install
    pnpm dev
    ```

2. Open the Figma desktop app and import the plugin:

    - Open a file in Figma.
    - Search for "Import plugin from manifest..." using the [Quick Actions](https://help.figma.com/hc/en-us/articles/360040328653-Use-shortcuts-and-quick-actions#Use_quick_actions) bar.
    - Choose the `manifest.json` file from the `dist` folder.

3. Manage `manifest` details from inside `package.json`.

### Developing

To develop Plugma locally while using the sandbox plugin.

1. Run the following command:

    ```bash
    pnpm dev:plugma
    ```

2. And then in another terminal run:

    ```bash
    pnpm dev
    ```

### Browser Preview

To preview your plugin in the browser during development.

1. Open plugin in the Figma desktop app.
2. Run the following command.

    ```bash
    pnpm preview
    ```

### Vitest

1. Open plugin in the Figma desktop app.
2. Run the following command.

    ```bash
    pnpm dev
    pnpm vitest
    ```

3. With Vitest's UI

    ```bash
    pnpm dev
    pnpm vitest --ui
    ```

### Playwright

1. Open plugin in the Figma desktop app.
2. Run the following command.

    ```bash
    pnpm playwright
    ```

### Advanced

See the [Plugma docs](https://plugma.dev/docs) for further information.
