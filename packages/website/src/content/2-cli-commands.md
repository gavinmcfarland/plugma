# CLI commands

When using the commands with `npm run` you need to pass the arguments with a double dash `--`, for example `npm run dev -- -p`.

### dev [options]

Start a server to develop your plugin. This command builds the `ui.html` and points it to the dev server making it easier to debug UI isues.

##### Options

-   `-p`, `--port`: Specify a port number for the plugin preview.
-   `-m`, `--mode`: Specify a mode.
-   `-ws`, `--websockets`: Enable websockets to preview in browser. (dev only)

##### Example

```bash
# Start development server on port 3000
plugma dev -p 3000

# Start development server with websockets enabled
plugma dev -ws
```

### build [options]

Create a build before publishing. This command compiles and bundles your plugin, preparing it for distribution.

##### Options

-   `-w`, `--watch`: Watch for changes and rebuild automatically.
-   `-m`, `--mode`: Specify a mode.

##### Example

```bash
# Build the plugin
plugma build

# Build and watch for changes
plugma build -w
```

### Preview [options]

Preview the plugin in a browser preview. This allows you to see how your plugin will look and function in any web browser. The plugin must be open in the Figma desktop app for this to work.

##### Options

-   `-p`, `--port`: Specify a port number for the plugin preview.
-   `-m`, `--mode`: Specify a mode.

##### Example

```bash
# Preview the plugin on port 8080
plugma preview -p 8080
```

### Release [version] [options]

Build the plugin and release to GitHub. This command automates the process of creating a new release on GitHub with your latest changes. If you call the command without a version, it will automatically increment the `plugma.pluginVersion` field in the `package.json` file.

##### Version

-   `alpha`, `beta`, `stable` or an integer (optional)

##### Options

-   `-t`, `--title`: Custom title for the release.
-   `-n`, `--notes`: Add release notes.

##### Example

```bash
# Increment the next stable version
plugma release

# Release a beta version with custom title and notes
plugma release beta -t "Beta Release v0.2" -n "This release includes new features X and Y"
```
