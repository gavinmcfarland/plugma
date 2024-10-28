# Running CLI commands

<blockquote class="info">
When using the commands with `npm run` you need to pass the arguments with a double dash `--`, for example `npm run dev -- -p`.
</blockquote>

## dev [options]

Start a server to develop your plugin. This command builds the `ui.html` and points it to the dev server making it easier to develop and debug your plugin.

##### Options

-   `-p`, `--port`: Specify a port number for the plugin preview.
-   `-m`, `--mode`: Specify a mode.
-   `-ws`, `--websockets`: Enable websockets to preview in browser.

##### Example

```bash
# Start development server on port 3000
plugma dev -p 3000

# Start development server with websockets enabled
plugma dev -ws
```

## preview [options]

<mark>Coming in V1</mark>

Preview your plugin in any browser to see how it looks and works. Make sure the plugin is open in the Figma desktop app for this to work.

##### Options

-   `-p`, `--port`: Specify a port number for the plugin preview.
-   `-m`, `--mode`: Specify a mode.

##### Example

```bash
# Preview the plugin on port 8080
plugma preview -p 8080
```

## build [options]

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

## release [version] [options]

<mark>Coming in V1</mark>

Build the plugin and release to GitHub. This command automates creating a new GitHub release with your latest changes. If no version is specified, it will automatically update the `plugma.pluginVersion` field in `package.json`.

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
plugma release beta -t "New feature" -n "This release includes new features X and Y"
```
