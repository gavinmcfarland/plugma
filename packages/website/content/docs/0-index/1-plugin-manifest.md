# Plugin manifest

The manifest defines your Figma plugin’s core settings, including plugin details and network configurations. Here's how to set up the manifest to work with Plugma.

You can see the full list of available fields in Figma's [plugin manifest documentation](https://www.figma.com/plugin-docs/manifest/).

## Manifest location

The manifest can be configured in a few different ways, either by placing a `manifest.ts`, `manifest.js` or `manifest.json` file in your project root, or by adding a `plugma.manifest` field to your package.json.

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

#### Example using `manifest.ts`

<blockquote class="warning">
Support for type-safe files is still a work in progress, so changes may not trigger a plugin reload while it’s running.
</blockquote>

```ts
import { defineManifest } from 'plugma/utils';

export default defineManifest(() => {
	return {
		id: 'com.my-plugin',
		name: 'My Plugin',
		api: '1.0.0',
		main: 'src/main.ts',
		ui: 'src/ui.ts',
		editorType: ['figma', 'figjam', 'slides'],
		networkAccess: {
			allowedDomains: ['none']
		}
	};
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
