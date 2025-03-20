# Plugin manifest

The manifest defines your Figma plugin’s core settings, including plugin details and network configurations. Here's how to set up the manifest to work with Plugma.

You can see the full list of available fields in Figma's [plugin manifest documentation](https://www.figma.com/plugin-docs/manifest/).

## Manifest location

Configure the plugin manifest by adding a `plugma.manifest` field to the `package.json` file or placing a `manifest.json` file in the project root.

##### Example using package.json

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

## Plugin files

The `main` and `ui` fields must point to the source files and not the dist files. The `ui` field should point to where the UI is mounted.

```jsonc
{
	//...
	"main": "src/main.js",
	"ui": "src/ui.js"
}
```

The UI source file is bundled into a html file, which can be referenced in the `main` code using `figma.showUI` with the `__html__` constant.

<blockquote class="warning">
Plugma currently does not allow using a map for the `ui` field, which means `__uiFiles__` is not yet supported.
</blockquote>

## DevAllowedDomains

### Localhost

While developing locally, Plugma uses a local dev server. This server must be specified in the `devAllowedDomains` field to ensure that Figma only accepts this domain, blocking others unless they are specified in `allowedDomains`.

```jsonc
{
	// ...
	"networkAccess": {
		"allowedDomains": ["http://example"],
		"devAllowedDomains": ["http://localhost:*"]
	}
}
```

<blockquote class="info">
Using a wildcard `*` for the port number, such as `http://localhost:*`, will ensure your setup works with any local port that Plugma assigns to the dev server.
</blockquote>

### Websockets

If you're using WebSockets for previewing in the browser or unit testing, it's important the URL for the WebSocket server (e.g., `ws://localhost:*`) is listed under `devAllowedDomains`. This allows Plugma to connect over WebSockets when developing and testing locally.

```jsonc
{
	// ...
	"networkAccess": {
		// ...
		"devAllowedDomains": [
            "http://localhost:*",
            "ws://localhost:*"
        ]
	}
}
```
