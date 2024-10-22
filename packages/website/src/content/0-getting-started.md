# Getting started

Plugma is powerful command-line interface that's designed to streamline your development workflow, making it easier to create, build, and manage your plugins.

### Installation

To create a new plugin, run the following command in your terminal and follow the prompts.

```bash
npm create plugma@latest
```

After this, change directory to the plugin and install the dependencies.

```bash
cd my-plugin
npm install
```

### Basic usage

To start developing run the following command.

```bash
npm run dev
```

This will create a build in the `dist` folder that will look like this.

```bash
dist/
  ui.html
  code.js
  manifest.json
```

With the Figma desktop app open, run `Cmd + /` to open the Actions Menu. Now search for `Import plugin from manifest...`. Navigate to where your plugin is and select the `manifest.json` file inside the `dist` folder.

To open your plugin open the Actions Menu again and then search for your plugin. It should appear in the menu and will open when you select it. From now on any changes you make to the code will be reflected instantly in the UI.

### Before publishing

When publishing your plugin, remember to create a build, otherwise when users open you're plugin it will still be pointing to the dev server and it will not work correctly.
