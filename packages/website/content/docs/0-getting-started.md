# Getting started

Plugma is a powerful command-line interface designed to streamline your development workflow. It makes it easier to create, build, and manage your plugins.

## Prerequisites

Before you start, ensure you have [Node.js](https://nodejs.org/en) and the [Figma desktop app](https://www.figma.com/downloads/) installed. These tools are essential for developing plugins.

## Start from a template

To create a plugin from a template, run the following command in your terminal and follow the prompts.

```bash
npm create plugma@latest
```

## Migrate an existing plugin

If you already have a Figma plugin, you can follow our [migration guide](./migrating-an-existing-plugin) to convert it to use Plugma.

## Install and import

Change to the plugin directory and install the dependencies.

```bash
cd my-plugin
npm install
```

Run the following to watch for changes while developing.

```bash
npm run dev
```

### Import the plugin

After you've run the `dev`, `build` or `preview` command, a `dist` directory will be created where you can import the plugin from the `manifest.json` file.

1. Open a file in Figma.
2. Search for "Import plugin from manifest..." using the [Actions](https://help.figma.com/hc/en-us/articles/23570416033943-Use-the-actions-menu-in-Figma-Design) menu (`Cmd + /`).
3. Choose the `manifest.json` file from the `dist` folder.

Open the Figma desktop app, go to the Actions menu, search for your plugin, and select it. Your code changes will update instantly in the UI.

## Before publishing

Before publishing your plugin, make sure to create a build. If not, it will still point to the dev server and won't work properly for users.

```bash
npm run build
```
