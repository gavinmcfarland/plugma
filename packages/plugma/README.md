<p align="center">
    <img src="https://github.com/user-attachments/assets/f5667ecb-8893-4ddb-bf9c-010624e8700a" alt="Plugma and Vite logos" width="460" height="auto">
</p>

# Plugma

Plugma is a powerful command-line tool that simplifies your plugin development workflow. It enables easy creation, development, and testing with features like true hot module reloading (HMR), in-browser previews, unified bundling, and .env support for environment variables.

For full documentation see [plugma.dev](https://www.plugma.dev/).

## Start from a template

Initialize a new project with Plugma:

```bash
npm create plugma@latest
```

This command creates a new Figma plugin project with your chosen framework, including all the necessary setup and configuration files.

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

-   `plugma dev`: Start a server to develop your plugin.
-   `plugma build`: Create a build before publishing.
-   `plugma preview`: Preview the plugin in a browser preview.
-   `plugma release`: Build the plugin and release to GitHub.

Run `plugma --help` for a full list of the options.

## Requirements

-   [Node.js](https://nodejs.org/en)
-   [Figma desktop app](https://www.figma.com/downloads/)

### License

Plugma is MIT licensed. See the LICENSE file for more details.
