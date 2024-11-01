# Migrating an existing plugin

This guide outlines the steps to update your Figma plugin to work seamlessly with Plugma. While Plugma is compatible with **React**, **Svelte**, **Vue**, and **vanilla JS/TS**, compatibility with other frameworks may vary.

## Steps to migrate

### Step 1: Install Plugma

Add Plugma as a dependency in your project.

```bash
npm install plugma@latest
```

### Step 2: Update `package.json` scripts

Add Plugma commands in the scripts section to handle development, building, previewing, and releasing.

```jsonc
"scripts": {
    "dev": "plugma dev",
    "build": "plugma build",
    "preview": "plugma preview",
    "release": "plugma release"
}
```

### Step 3: Update file paths in `manifest.json`

Update the `main` and `ui` fields in your Figma plugin manifest to point to your source files.

```jsonc
{
	// ...
	"main": "src/main.ts",
	"ui": "src/ui.ts"
}
```

### Step 4: Allow development network access

To allow local development with live reloading and WebSocket support, add the following domains to the `networkAccess.devAllowedDomains` field in your manifest.

```jsonc
"networkAccess": {
    // ...
    "devAllowedDomains": [
        "http://localhost:*",
        "ws://localhost:9001"
    ]
}
```

### Step 5: Wrap your `main` code in a default function

Plugma requires that your `main` code is wrapped in and exported as a default function, so that it can enable certain features during development.

```js
export default function () {
	// Your Figma plugin main code here
}
```

### Step 6: Update `ts.config.js` configuration

If your project uses TypeScript, add the necessary type definitions for Figma to your `tsconfig.json` file.

```jsonc
{
	// ...
	"compilerOptions": {
		"typeRoots": ["node_modules/@figma"]
	}
}
```

### Step 7: Build and import the plugin in Figma

Run the `build` command to create a `dist` folder with it's own `manifest.json` file, and import it into Figma.

```bash
npm run build
```

Use Figma's [Actions](https://help.figma.com/hc/en-us/articles/23570416033943-Use-the-actions-menu-in-Figma-Design) menu (`Cmd + /`) to search for "Import plugin from manifest..." and select the new manifest.

## Additional considerations

Since Figma plugins must be bundled into a single `main` file and a `ui` file, ensure all assets are either inlined or hosted externally and must be included in the `networkAccess` field of your manifest.
