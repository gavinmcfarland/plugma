<p align="center">
    <img src="https://github.com/user-attachments/assets/b9b3e1ef-973b-4a8c-831b-014dca728696" alt="Plugma and Vite logos" width="auto" height="208">
</p>

<div align="center">

[![npm version](https://img.shields.io/npm/v/plugma/next.svg)](https://www.npmjs.com/package/plugma)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/discord/1234567890?color=5865F2&label=Discord&logo=discord&logoColor=white)](https://discord.gg/RvHH4ZnKXS)

<!-- [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com) -->

</div>

# Plugma

Plugma is a powerful command-line tool that simplifies your Figma plugin development workflow. It enables easy creation, development, and testing with features like true hot module reloading (HMR), in-browser previews, unified bundling, and .env support for environment variables.

For full documentation see [plugma.dev](https://www.plugma.dev/).

> [!NOTE]
> This repo is in beta and things may not work as expected or their implementation may change.

For comprehensive documentation, visit [plugma.dev](https://www.plugma.dev/).

## Quick Start

Create a new plugin from a template:

```bash
npm create plugma@latest
```

Supported frameworks:

- React
- Svelte
- Vue
- Vanilla JavaScript

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

| Command          | Description                       |
| ---------------- | --------------------------------- |
| `plugma dev`     | Start development server with HMR |
| `plugma build`   | Create production build           |
| `plugma preview` | Preview plugin in browser         |
| `plugma release` | Build and release to GitHub       |
| `plugma add`     | Add integrations to your plugin   |

Run `plugma --help` for complete command documentation.

## Prerequisites

- [Node.js](https://nodejs.org/en) (LTS version recommended)
- [Figma Desktop App](https://www.figma.com/downloads/)

<!-- ## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details. -->

## License

Plugma is MIT licensed. See the [LICENSE](LICENSE) file for details.
