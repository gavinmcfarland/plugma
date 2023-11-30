# Readme

Use this framework to spead up creating plugins in any framework.

## Features

-   Live Development Server: Develop your plugin UI by connecting the plugin window to a development server, eliminating the need to bundle your UI file during development.

-   Browser Preview: Test your plugin's UI in various browsers in real-time without needing to publish your file. Figma's CSS variables are automatically passed from Figma to your local development server for accurate style previews.

```shell
npm create plugma@latest my-plugin
```

Then follow the prompts.

Once a template has been copied across:

```shell
cd my-plugin
npm install
npm run build
```

## Folder Structure

```
lib/
dist/
    code.js
    ui.html
scr/
    main.js
    ui.svelte
manifest.json
package.json
README.md
```
