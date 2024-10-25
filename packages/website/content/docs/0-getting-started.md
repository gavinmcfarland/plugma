# Getting started

Plugma is a powerful command-line interface designed to streamline your development workflow. It makes it easier to create, build, and manage your plugins.

### Start from a template

To create a plugin from a template, run the following command in your terminal and follow the prompts.

```bash
npm create plugma@latest
```

After this, change to the plugin directory and install the dependencies.

```bash
cd my-plugin
npm install
```

### Develop and import

To watch for changes while developing, run the following.

```bash
npm run dev
```

1. Open a file in Figma.
2. Search for "Import plugin from manifest..." using the [Actions](https://help.figma.com/hc/en-us/articles/23570416033943-Use-the-actions-menu-in-Figma-Design) menu.
3. Choose the `manifest.json` file from the `dist` folder.

To open your plugin, go to the Actions menu, search for your plugin, and select it. Your code changes will now update instantly in the UI.

### Before publishing

Before publishing your plugin, make sure to create a build. If not, it will still point to the dev server and won't work properly for users.

```bash
npm run build
```
