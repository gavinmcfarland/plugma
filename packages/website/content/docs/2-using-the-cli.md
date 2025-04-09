# Using the CLI

Plugma comes with a Command Line Interface that supports the following commands.

## Commands

<details>

<summary>

### `dev`

</summary>

Start a server to develop your plugin. This command builds the `ui.html` and points it to the dev server making it easier to develop and debug your plugin.

##### Usage

```bash
plugma dev [options]
```

##### Options

-   `-p`, `--port`: Specify a port number for the plugin preview.
-   `-o`, `--output`: Specify an output dir, default is `dist`.
-   `-m`, `--mode`: Specify a mode.
-   `-ws`, `--websockets`: Enable WebSockets to preview in browser.

##### Example

```bash
# Start development server on port 3000
plugma dev -p 3000

# Start development server with websockets enabled
plugma dev -ws
```

<blockquote class="info">
When using the commands with `npm run` you need to pass the arguments with a double dash `--`, for example `npm run dev -- -p 3000`.
</blockquote>

</details>

<details>

<summary>

### `preview`

</summary>

Preview your plugin in any browser to see how it looks and works. Make sure the plugin is open in the Figma desktop app for this to work.

##### Usage

```bash
plugma preview [options]
```

##### Options

-   `-p`, `--port`: Specify a port number for the plugin preview.
-   `-o`, `--output`: Specify an output dir, default is `dist`.
-   `-m`, `--mode`: Specify a mode.

##### Example

```bash
# Preview the plugin on port 8080
plugma preview -p 8080
```

</details>

<details>

<summary>

### `build`

</summary>

Create a build before publishing. This command compiles and bundles your plugin, preparing it for distribution.

##### Usage

```bash
plugma build [options]
```

##### Options

-   `-w`, `--watch`: Watch for changes and rebuild automatically.
-   `-o`, `--output`: Specify an output dir, default is `dist`.
-   `-m`, `--mode`: Specify a mode.

##### Example

```bash
# Build the plugin
plugma build

# Build and watch for changes
plugma build -w
```

</details>

<details>

<summary>

### `release`

</summary>

Build the plugin and release to GitHub. This command automates creating a new GitHub release with your latest changes. If no version is specified, it will automatically update the `plugma.pluginVersion` field in `package.json`.

```bash
plugma build [version] [options]
```

##### Version

-   `alpha`, `beta`, `stable` or an integer (optional)

##### Options

-   `-t`, `--title`: Custom title for the release.
-   `-n`, `--notes`: Add release notes.
-   `-o`, `--output`: Specify an output dir, default is `dist`.

##### Example

```bash
# Increment the next stable version
plugma release

# Release a beta version with custom title and notes
plugma release beta -t "New feature" -n "This release includes new features X and Y"
```

</details>

<details>

<summary>

### `test`

</summary>

Run unit tests against your plugin.

##### Usage

The developer server must be running first by using the `dev` command before running tests.

```bash
plugma test
```

<!-- ##### Options

-   `-w`, `--watch`: Watch for changes and rerun tests automatically. -->

##### Example

```bash
# Start development server and run tests
plugma dev # In one terminal
plugma test # In another terminal
```

<blockquote class="info">
When using the commands with `npm run` you need to pass the arguments with a double dash `--`, for example `npm run dev -- -p 3000`.
</blockquote>

</details>

## Installing globally

If you'd prefer to use the CLI globally you can install it using the following.

```bash
npm install plugma -g
```
