<p align="center">
    <img src="https://github.com/user-attachments/assets/f60ce7c1-f042-4357-8aad-548accc20671" alt="plugma-logo" width="200" height="auto">
</p>

# Plugma

Plugma is a powerful command-line interface designed to streamline your development workflow. It makes it easier to create, develop, and test your plugins. With features like, true HMR, browser preview.

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
