# Plugin manifest

The manifest sets up your Figma plugin’s core settings, from plugin details to network configurations. Plugma makes it easy to configure the manifest with the options outlined below.

## Manifest location

You can configure the manifest by adding a `plugma.manifest` field to the `package.json` file or placing a `manifest.json` file in the project root.

<!-- <blockquote class="info">
It's important that the path in the `main` and `ui` field point to the source files, and not the build files.
</blockquote> -->

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

When defining the relative file paths for the `main` code and the `ui`, they must point to the entry point for the code and ui source files, not the build files. This allows you to organize and name your source files as you prefer.

```jsonc
{
	//...
	"main": "src/code.js",
	"ui": "src/ui.js"
}
```

The `ui` field specifies the relative path to the source file for your plugin's user interface. This source file is compiled into a bundled file, which can be displayed in the iframe modal by referencing it with the `__html__` constant when using `figma.showUI`.

<blockquote class="warning">
Plugma currently does not allow using a map for the `ui` field, which means `__uiFiles__` is not yet supported.
</blockquote>

## DevAllowedDomains

### Localhost

While developing locally, Plugma uses a local dev server. This server must be specified in `networkAccess.devAllowedDomains` to ensure that Figma only accepts this domain, blocking others unless they are specified in `allowedDomains`.

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

If you're using WebSockets for previewing in the browser or unit testing, it's important the URL for the WebSocket server (e.g., `ws://localhost:*`) is listed under `devAllowedDomains`. This allows Plugma to connect over WebSockets when developing locally.

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
