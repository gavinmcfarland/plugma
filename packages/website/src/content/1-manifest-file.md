# Plugin manifest

The plugin manifest provides essential information about the plugin, including its name, version, permissions, and features.

You can define the manifest by placing a `manifest.json` file in the project root or by adding a `plugma.manifest` field to the `package.json` file.

##### Using package.json

```jsonc
{
	//...
	"plugma": {
		"manifest": {
			"name": "My Plugin",
			"id": "com.example.myplugin",
			"api": "1.0.0",
			"main": "src/code.js",
			"ui": "src/ui.js"
		}
	}
}
```

##### Using manifest.json

```json
{
	"name": "My Plugin",
	"id": "com.example.myplugin",
	"api": "1.0.0",
	"main": "src/code.js",
	"ui": "src/ui.js"
}
```
