<p align="center">
    <img src="https://github.com/user-attachments/assets/b9b3e1ef-973b-4a8c-831b-014dca728696" alt="Plugma and Vite logos" width="auto" height="208">
</p>

# Plugma

Plugma is a powerful command-line tool that simplifies your Figma plugin development workflow. It enables easy creation, development, and testing with features like true hot module reloading (HMR), in-browser previews, unified bundling, and .env support for environment variables.

For full documentation see [plugma.dev](https://www.plugma.dev/).

## Start from a template

Create a plugin from a template using the following:

```bash
npm create plugma@latest
```

The frameworks currently supported are `React`, `Svelte`, `Vue` and vanilla `JavaScript`.

> [!WARNING]
> Early Access - try the next release:
>
> ```bash
> npx plugma@next create
> ```

## Installation

Add Plugma as a project dependency:

```bash
npm install plugma --save-dev
```

Or install it globally:

```bash
npm install -g plugma
```

## Commands

- `plugma dev`: Start a server to develop your plugin.
- `plugma build`: Create a build before publishing.
- `plugma preview`: Preview the plugin in a browser preview.
- `plugma release`: Build the plugin and release to GitHub.

Run `plugma --help` for a full list of the options.

## Requirements

- [Node.js](https://nodejs.org/en)
- [Figma desktop app](https://www.figma.com/downloads/)

## License

Plugma is MIT licensed. See the LICENSE file for more details.
