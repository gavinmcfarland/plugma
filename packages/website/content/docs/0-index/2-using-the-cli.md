# Using the CLI

Plugma comes with a Command Line Interface that supports the following commands.

## Commands

<details>

<summary>

### create

</summary>

Walks you through creating a Figma plugin or widget.

##### Usage

```package-manager
npm create plugma@latest [type?] [framework?] [options]
```

##### Options

- `--template <name>`: Use a specific template
- `--framework <name>`: UI framework
- `--dir <dpath>`: Project directory name
- `--no-ts`: Use JavaScript instead of TypeScript
- `--no-ui`: No UI
- `--no-add`: Skip installing add-ons
- `--no-install`: Skip installing dependencies
- `--install <pkg-manager>`: Install dependencies using a specific package manager (npm, yarn, pnpm)
- `-y, --yes`: Skip all prompts by accepting defaults (still prompts for type and framework if not provided). Requires an empty directory when creating in current directory.

##### Example

```package-manager
# Create a react plugin with the defaults
npm create plugma@latest -- plugin react --yes

# Create a widget using JavaScript with no UI using the defaults
npm create plugma@latest -- widget --yes --no-ts

# Skip most prompts but still ask for type and framework
npm create plugma@latest -- --yes

# Skip all prompts when type and framework are provided
npm create plugma@latest -- plugin react --yes

# Create with just framework (type will be prompted)
npm create plugma@latest -- svelte --yes

# Create with custom directory name
npm create plugma@latest -- plugin react --dir my-custom-plugin

# Install with specific package manager
npm create plugma@latest -- plugin react --install pnpm

# Install with yarn
npm create plugma@latest -- widget svelte --install yarn

# Note: --yes requires an empty directory when creating in current directory
# If directory is not empty, you'll get an error message
```

</details>

<details>

<summary>

### dev

</summary>

Start a server to develop your plugin. This command builds the `ui.html` and points it to the dev server making it easier to develop and debug your plugin.

##### Usage

```package-manager
npm run dev [options]
```

##### Options

- `-p`, `--port`: Specify a port number for the plugin preview.
- `-o`, `--output`: Specify an output dir, default is `dist`.
- `-m`, `--mode`: Specify a mode.
- `--no-websockets`: Disable WebSockets.
- `--dock-plugin`: Minimise and dock the plugin in the Figma UI.

##### Example

```package-manager
# Start development server on port 3000
npm run dev -- -p 3000
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

```package-manager
npm run build [options]
```

##### Options

- `-w`, `--watch`: Watch for changes and rebuild automatically.
- `-o`, `--output`: Specify an output dir, default is `dist`.
- `-m`, `--mode`: Specify a mode.

##### Example

```package-manager
# Build the plugin
npm run build

# Build and watch for changes
npm run build -- -w
```

</details>

<details>

<summary>

### release

</summary>

Build the plugin and release to GitHub. This command automates creating a new GitHub release with your latest changes. If no version is specified, it will automatically update the `plugma.pluginVersion` field in `package.json`.

```package-manager
npm run release [version] [options]
```

##### Version

- `alpha`, `beta`, `stable` or an integer (optional)

##### Options

- `--title`: Custom title for the release.
- `--notes`: Add release notes.
- `--prefix`: Specify a prefix to prepend to the version number (e.g., "figma-plugin").
- `-o`, `--output`: Specify an output dir, default is `dist`.

##### Example

```package-manager
# Increment the next stable version
npm run release

# Release a beta version with custom title and notes
npm run release -- beta -t "New feature" -n "This release includes new features X and Y"

# Release with a custom prefix (creates tag: figma-plugin@1)
npm run release -- --prefix "figma-plugin" --title "Plugin Release"

# Release alpha version with custom prefix (creates tag: plugin@2-alpha.0)
npm run release -- alpha --prefix "plugin" --title "Alpha Release"
```

</details>

<details>

<summary>

### add

</summary>

Adds support for various integrations to your project, including testing frameworks, UI libraries, and other development tools.

##### Usage

```package-manager
npm create plugma@latest add
```

##### Integration

- `playwright`
- `vitest`
- `tailwind`
- `shadcn`

<!-- ##### Options

- `--no-install` - prevents installing dependencies -->

</details>

## Installing globally

If you'd prefer to use the CLI globally you can install it using the following.

```package-manager
npm install plugma -g
```
