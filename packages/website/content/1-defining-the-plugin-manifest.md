# Defining the plugin manifest

You can define the manifest by placing a `manifest.json` file in the project root or by adding a `plugma.manifest` field to the `package.json` file.

<blockquote class="info">
It's important that the path in the `main` and `ui` field point to the source files, and not the build files.
</blockquote>

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
