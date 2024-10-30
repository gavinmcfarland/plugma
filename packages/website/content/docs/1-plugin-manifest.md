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

When you define the relative file path to the `main` code and the `ui`, it must point to the source files and not the build files. This lets you choose where to store and how to name your source files.

```jsonc
{
	//...
	"main": "src/code.js",
	"ui": "src/ui.js"
}
```

## DevAllowedDomains

### Localhost

While developing locally, Plugma uses a local dev server. This server must be specified in `networkAccess.devAllowedDomains` to ensure that Figma only accepts this domain, blocking others unless they are specified in `allowedDomains`.

```jsonc
{
	// ...
	"networkAccess": {
		"allowedDomains": ["http://example"],
		"devAllowedDomains": ["http://localhost:4000"]
	}
}
```

<blockquote class="info">

Using a wildcard `*` for the port number, such as `http://localhost:*`, will ensure your setup works with any local port that Plugma assigns to the dev server.

</blockquote>

### Websockets

If you're using WebSockets, it's important the URL for the WebSocket server (e.g., `ws://localhost:9001`) is listed under `devAllowedDomains`. This allows Plugma to connect over WebSockets when developing locally.

```jsonc
{
	// ...
	"networkAccess": {
		// ...
		"devAllowedDomains": ["http://localhost:*", "ws://localhost:9001"]
	}
}
```
