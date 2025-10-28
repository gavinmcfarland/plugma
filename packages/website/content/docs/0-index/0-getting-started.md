# Getting started

Plugma is a powerful toolkit that streamlines your Figma plugin and widget development workflow. It makes it easy to create, build, and test your projects.

## Start from a Template

To create a new plugin or widget from a template, run the following command in your terminal and follow the prompts:

```package-manager
npm create plugma@latest
```

The CLI wizard will guide you through setup; asking whether you want to create a plugin or widget, and optionally choose a framework if your project includes a UI.

## Build and Import

Navigate to your new project folder and install dependencies:

```package-manager
cd my-plugin
npm install
```

Then build your plugin files into the **`dist/`** folder:

```package-manager
npm run build
```

Once built, import your plugin into Figma:

1. Open a file in the Figma desktop app.
2. Press `Cmd/Ctrl + K` to open the [Actions](https://help.figma.com/hc/en-us/articles/23570416033943-Use-the-actions-menu-in-Figma-Design) menu.
3. Search for **“Import plugin (or widget) from manifest…”**
4. Select **`dist/manifest.json`** (not the one in the project root).

After importing, open the Actions menu again, search for your plugin or widget to run it.

## Developing

Run the dev server to watch for changes and rebuild automatically.

```package-manager
npm run dev
```

While the dev server is running:

- Files are automatically recompiled into **`dist/`** on save.
- The plugin UI hot-reloads instantly.
- Edits to **`./manifest.json`** sync to **`dist/manifest.json`**.
- A browser preview is available from the link shown in the terminal (plugin UI must be open in Figma).

## Before Publishing

Before publishing your plugin or widget, run a production build to ensure it no longer points to the dev server:

```package-manager
npm run build
```

## Migrating an Existing Plugin

Already have a Figma plugin or widget? Follow the [migration guide](./migrating-an-existing-plugin) to use it with Plugma.
