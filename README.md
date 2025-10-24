<p align="center">
    <img src="https://github.com/user-attachments/assets/b9b3e1ef-973b-4a8c-831b-014dca728696" alt="Plugma and Vite logos" width="auto" height="208">
</p>

<div align="center">

[![npm version](https://img.shields.io/npm/v/plugma/next.svg)](https://www.npmjs.com/package/plugma)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/discord/1369975781811425382?logo=discord&logoColor=white&label=discord)](https://discord.gg/RvHH4ZnKXS)

<!-- [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com) -->

</div>

# Plugma

Plugma is a powerful command-line tool that simplifies your Figma plugin development workflow. It enables easy creation, development, and testing with features like true hot module reloading (HMR), in-browser previews, unified bundling, and .env support for environment variables.

For full documentation see [plugma.dev](https://next.plugma.dev/).

> [!WARNING]
> This repository is in development and features may not work as expected or may undergo changes before release.

## Quick Start

Create a new plugin or widget from a template.

```bash
npx plugma@next create
```

Supported frameworks:

- React
- Svelte
- Vue

## Installation

Add Plugma as a project dependency:

```bash
npm install plugma --save-dev
```

Or install it globally:

```bash
npm install -g plugma
```

## Development

If you're contributing to Plugma or want to run it locally:

1. **Clone the repository:**

    ```bash
    git clone https://github.com/your-org/plugma.git
    cd plugma
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Set up development environment:**

    ```bash
    ./dev-setup.sh
    ```

    This configures the `versions.json` files to use `link:../../plugma` dependencies for local development.

4. **Start development:**

    ```bash
    # In packages/plugma
    npm run dev

    # In packages/create-plugma (separate terminal)
    npm run dev
    ```

5. **When ready to publish:**
    ```bash
    # This automatically sets versions.json to use actual version numbers
    npm run prepublishOnly
    ```

The development setup ensures that when you create new plugins using `create-plugma`, they will use the local development version of `plugma` instead of the published version.

## Commands

| Command          | Description                       |
| ---------------- | --------------------------------- |
| `plugma create`  | Create a plugin or widget         |
| `plugma dev`     | Start development server with HMR |
| `plugma build`   | Create production build           |
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
