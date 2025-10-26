# Migrating an existing plugin

This guide outlines the steps to update your Figma plugin to work seamlessly with Plugma. While Plugma is compatible with **React**, **Svelte**, **Vue**, and **vanilla JS/TS**, compatibility with other frameworks may vary.

## Steps to migrate

### 1: Install Plugma

Add Plugma as a dependency in your project.

```package-manager
npm install plugma@latest
```

### 2: Update `package.json` scripts

Add Plugma commands in the scripts section to handle development, building, previewing, releasing and testing.

```jsonc
"scripts": {
    "dev": "plugma dev",
    "build": "plugma build",
    "release": "plugma release"
}
```

### 3: Update file paths in `manifest.json`

Make sure the `main` and `ui` fields point to the source files and not the dist files. The `ui` field should point to where the UI is mounted. You can organize these files however you prefer. To avoid confusion with the `main` field, consider renaming your UI entry file (typically `main.ts` or `main.js`) to something like `ui.ts`.

```jsonc
{
	// ...
	"main": "src/main.ts",
	"ui": "src/ui.ts"
}
```

### 4: Wrap your `main` code in a default function

Plugma requires that your `main` code is wrapped in and exported as a default function, so that it can enable certain features during development.

```js
export default function () {
	// Your Figma plugin main code here
}
```

### 5: Update or remove the `index.html` template file

If you have an `index.html` file either remove it or update it to include the `<!--[ PLUGIN_UI ]-->` placeholder where the Plugma generated UI code will be injected.

```html
<html>
	<head>
		<title><!--[ PLUGIN_NAME ]--></title>
	</head>
	<body>
		<div id="app"></div>
		<!--[ PLUGIN_UI ]-->
	</body>
</html>
```

### 6: Add TypeScript definitions for Figma

If your project uses TypeScript, install the necessary type definitions for Figma

```package-manager
npm install @figma/plugin-typings
```

And add the following to your `tsconfig.json` file.

```jsonc
{
	"compilerOptions": {
        // ...
		"typeRoots": [
            "./node_modules/@types"
            "node_modules/@figma",
        ]
	}
}
```

### 7: Make sure your ui framework mounts to correct div

Each framework will have it's own file for mounting the UI to the DOM. Make sure the id of the element that this is mounted to is called `app`.

```js
import { mount } from 'svelte'
import './styles.css'
import App from './App.svelte'

const app = mount(App, {
	target: document.getElementById('app')!,
})

export default app
```

### 8: Add a `vite.config.js` to your plugin

Plugma uses vite. If you need to make any changes to your bundling process you can define them here.

```js
/// <reference path="./src/ui/vite-env.d.ts" />

import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig((context) => {
	return {
		plugins: context == "ui" ? [svelte()] : [];
	}
});
```

### 9: Build and import the plugin in Figma

Run the `build` command to create a `dist` folder with it's own `manifest.json` file, and import it using the Figma desktop app.

```package-manager
npm run build
```

Use Figma's [Actions](https://help.figma.com/hc/en-us/articles/23570416033943-Use-the-actions-menu-in-Figma-Design) menu (`Cmd + /`) to search for "Import plugin from manifest..." and select the new manifest.

## Additional considerations

Since Figma plugins must be bundled into a single `main` file and a `ui` file, ensure all assets are either inlined or hosted externally and are included in the `networkAccess` field of your manifest.
