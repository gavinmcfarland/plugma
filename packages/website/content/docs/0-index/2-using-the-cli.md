# Using the CLI

Plugma comes with a Command Line Interface that supports the following commands.

<blockquote class="info">
When using the commands with `npm run` you need to pass the arguments with a double dash `--`, for example `npm run dev -- -p 3000`.
</blockquote>

## Commands

<details>

<summary>

### create

</summary>

Walks you through creating a Figma plugin or widget.

##### Usage

```bash
plugma create [type?] [framework?] [options]
```

##### Options

- `--template <template>`: Use a specific template
- `--framework <framework>`: UI framework
- `--name <name>`: Project name
- `--no-ts`: Use JavaScript instead of TypeScript
- `--no-ui`: No UI
- `--no-add-ons`: Skip installing add-ons
- `--no-install`: Skip installing dependencies
- `--install <pkg-manager>`: Install dependencies using a certain package manager

##### Example

```bash
# Create a react plugin with the defaults
plugma create plugin react --yes
```

<details>

<summary>

### dev

</summary>

Start a server to develop your plugin. This command builds the `ui.html` and points it to the dev server making it easier to develop and debug your plugin.

##### Usage

```bash
plugma dev [options]
```

##### Options

- `-p`, `--port`: Specify a port number for the plugin preview.
- `-o`, `--output`: Specify an output dir, default is `dist`.
- `-m`, `--mode`: Specify a mode.
- `--no-websockets`: Disable WebSockets.
- `--dock-plugin`: Minimise and dock the plugin in the Figma UI.

##### Example

```bash
# Start development server on port 3000
plugma dev -p 3000
```

</details>

<details>

<!-- <summary>

### preview

</summary>

Preview your plugin in any browser to see how it looks and works. Make sure the plugin is open in the Figma desktop app for this to work.

##### Usage

```bash
plugma preview [options]
```

##### Options

- `-p`, `--port`: Specify a port number for the plugin preview.
- `-o`, `--output`: Specify an output dir, default is `dist`.
- `-m`, `--mode`: Specify a mode.

##### Example

```bash
# Preview the plugin on port 8080
plugma preview -p 8080
```

</details>

<details> -->

<summary>

### build

</summary>

Create a build before publishing. This command compiles and bundles your plugin, preparing it for distribution.

##### Usage

```bash
plugma build [options]
```

##### Options

- `-w`, `--watch`: Watch for changes and rebuild automatically.
- `-o`, `--output`: Specify an output dir, default is `dist`.
- `-m`, `--mode`: Specify a mode.

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

### release

</summary>

Build the plugin and release to GitHub. This command automates creating a new GitHub release with your latest changes. If no version is specified, it will automatically update the `plugma.pluginVersion` field in `package.json`.

```bash
plugma release [version] [options]
```

##### Version

- `alpha`, `beta`, `stable` or an integer (optional)

##### Options

- `--title`: Custom title for the release.
- `--notes`: Add release notes.
- `--prefix`: Specify a prefix to prepend to the version number (e.g., "figma-plugin").
- `-o`, `--output`: Specify an output dir, default is `dist`.

##### Example

```bash
# Increment the next stable version
plugma release

# Release a beta version with custom title and notes
plugma release beta -t "New feature" -n "This release includes new features X and Y"

# Release with a custom prefix (creates tag: figma-plugin@1)
plugma release --prefix "figma-plugin" --title "Plugin Release"

# Release alpha version with custom prefix (creates tag: plugin@2-alpha.0)
plugma release alpha --prefix "plugin" --title "Alpha Release"
```

</details>

### add

Adds support for various integrations to your project, including testing frameworks, UI libraries, and other development tools.

##### Usage

```bash
plugma add
```

##### Integration

- `playwright`
- `vitest`
- `tailwind`
- `shadcn`

<!-- ##### Options

- `--no-install` - prevents installing dependencies -->

## Installing globally

If you'd prefer to use the CLI globally you can install it using the following.

```bash
npm install plugma -g
```
