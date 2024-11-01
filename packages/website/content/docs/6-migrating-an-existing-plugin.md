# Migrating an existing plugin

Here's a quick guide on how to update your Figma plugin to work with Plugma. While Plugma has been tested with **React**, **Svelte**, **Vue**, and **vanilla JS/TS**, compatibility with other frameworks may vary.

## Steps to migrate

### Step 1: Update `package.json`

Add Plugma commands in the scripts section to handle development, building, previewing, and releasing.

```jsonc
"scripts": {
    "dev": "plugma dev",
    "build": "plugma build",
    "preview": "plugma preview",
    "release": "plugma release"
}
```

### Step 2: Update file paths in `manifest.json`

Update the `main` and `ui` fields in your Figma plugin manifest to point to your source files.

```jsonc
{
	// ...
	"main": "src/main.ts",
	"ui": "src/ui.ts"
}
```

### Step 3: Allow development network access

Allow access to localhost to support both the local development server and websockets server.

```jsonc
"networkAccess": {
    // ...
    "devAllowedDomains": [
        "http://localhost:*",
        "ws://localhost:9001"
    ]
}
```

### Step 4: Wrap your `main` code in a default function

For Plugma compatibility, export your main code as a default function. This allows Plugma to initialize your plugin code properly.

```js
export default function () {
	// Your Figma plugin main code here
}
```

### Step 5: Update `ts.config.js`

If your plugin uses TypeScript, add the necessary type definitions for Figma to your `tsconfig.json` file.

```jsonc
{
	// ...
	"compilerOptions": {
		"typeRoots": ["node_modules/@figma"]
	}
}
```

### Step 6: Build and import the `manifest.json` file

Run the `build` command to create a `dist` folder with it's own `manifest.json` file, and import it into Figma.

```bash
npm run build
```

Use Figma's [Actions](https://help.figma.com/hc/en-us/articles/23570416033943-Use-the-actions-menu-in-Figma-Design) menu (`Cmd + /`) to search for "Import plugin from manifest..." and select the new manifest.

## Additional considerations

Since Figma plugins must be bundled into a single `main` file and a `ui` file, ensure all assets are either inlined or hosted externally and must be included in the `networkAccess` field of your manifest.
