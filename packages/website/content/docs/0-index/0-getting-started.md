# Getting started

Plugma is a powerful toolkit designed to streamline your development workflow. It makes it easier to create, build, and test your plugins and widgets.

<!-- ## Prerequisites

Before you start, ensure you have [Node.js](https://nodejs.org/en) and the [Figma desktop app](https://www.figma.com/downloads/) installed. These tools are essential for developing plugins. -->

## Start From a Template

To create a plugin or widget from a template, run the following command in your terminal and follow the prompts.

```package-manager
npm create plugma@latest
```

### Installing Plugma

Change to the directory and install the dependencies.

```package-manager
cd my-plugin
npm install
```

Run the following to watch for changes while developing.

```package-manager
npm run dev
```

## Importing the plugin in Figma

After you've run the `dev`, `build` or `preview` command, a `dist` directory will be created where you can import the plugin from the `manifest.json` file.

1. Open a file in Figma in the desktop app.
2. Search for "Import plugin (or widget) from manifest..." using the [Actions](https://help.figma.com/hc/en-us/articles/23570416033943-Use-the-actions-menu-in-Figma-Design) menu (`Cmd + /`).
3. Choose the `manifest.json` file from the `dist` folder.

Go to the Actions menu, search for your plugin or widget, and select it. Your code changes will update instantly in the UI.

## Before publishing

Before publishing your plugin or widget, make sure to create a build. If not, it will still point to the dev server and won't work properly for users.

```package-manager
npm run build
```

## Migrating an existing plugin

If you already have a Figma plugin or widget, you can follow our [migration guide](./migrating-an-existing-plugin) to convert it to use Plugma.
