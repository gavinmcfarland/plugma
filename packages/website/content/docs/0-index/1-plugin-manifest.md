# Plugin manifest

The manifest defines your Figma plugin’s core settings, including plugin details and network configurations. Here's how to set up the manifest to work with Plugma.

You can see the full list of available fields in Figma's [plugin manifest documentation](https://www.figma.com/plugin-docs/manifest/).

## Manifest location

Plugma looks for your plugin manifest in several locations, checking them in a specific order. The first valid manifest found will be used.

### Manifest file priority

Plugma checks for manifest files in the project root directory in the following order:

1. **`manifest.ts`** - TypeScript manifest file (supports type safety)
2. **`manifest.js`** - JavaScript manifest file
3. **`manifest.json`** - JSON manifest file
4. **`package.json`** - Uses the `plugma.manifest` field

If no manifest is found in any of these locations in the project root, Plugma will throw an error.

#### Example using `package.json`

```jsonc
{
	//...
	"plugma": {
		"manifest": {
			"id": "com.myplugin",
			"name": "My Plugin",
			"api": "1.0.0",
			"main": "src/code.js",
			"ui": "src/ui.js",
			"editorType": ["figma", "figjam"],
			"networkAccess": {
				"allowedDomains": ["none"]
			}
		}
	}
}
```

#### Example using `manifest.json`

```json
{
	"id": "com.myplugin",
	"name": "My Plugin",
	"api": "1.0.0",
	"main": "src/code.js",
	"ui": "src/ui.js",
	"editorType": ["figma", "figjam"],
	"networkAccess": {
		"allowedDomains": ["none"]
	}
}
```

#### Example using `manifest.ts`

<blockquote class="warning">
Support for type-safe files is still a work in progress, so changes may not trigger a plugin reload while it's running.
</blockquote>

```ts
import { defineManifest } from 'plugma';

export default defineManifest({
	id: 'com.my-plugin',
	name: 'My Plugin',
	api: '1.0.0',
	main: 'src/main/main.ts',
	ui: 'src/ui/ui.tsx',
	editorType: ['figma', 'figjam'],
	networkAccess: {
		allowedDomains: ['none']
	}
});
```

## Main and UI fields

When setting up your plugin, ensure the `main` and `ui` fields in your manifest point to your source code files (e.g., src/main.js and src/ui.js), not the built files in `dist`. The `ui` field should point to the file where the plugin's interface is mounted.

```jsonc
{
	//...
	"main": "src/main.js",
	"ui": "src/ui.js"
}
```

The UI can be referenced in the `main` code using `figma.showUI` with the `__html__` constant.

<blockquote class="warning">
Plugma currently does not allow using a map for the `ui` field, which means `__uiFiles__` is not yet supported.
</blockquote>
