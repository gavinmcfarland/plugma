# Contributing

We welcome your contributions to this library! This document outlines the guidelines and instructions for contributing to the project.

## Development Setup

Before you begin, ensure you have the following prerequisites:

- Node.js (latest LTS version recommended)
- pnpm package manager
- Figma desktop app (for testing)

1. Clone the repository:

    ```bash
    git clone https://github.com/gavinmcfarland/plugma.git
    cd plugma
    ```

2. Change to the `next` branch:

3. Install dependencies:

    ```bash
    pnpm install
    ```

## Testing Your Changes

### Local Development ```

2. Start the sandbox plugin:

    ```bash
    cd ../../packages/plugma/test/sandbox
    pnpm dev
    ```

### Testing in Figma

1. Import the sandbox plugin in Figma:

    - Open a Figma file
    - Use Quick Actions (⌘/ or Ctrl+/)
    - Search for "Import plugin from manifest..."
    - Select the `manifest.json` file from `packages/plugma/test/sandbox/dist`

For more details about the sandbox plugin, see the instructions in the `packages/plugma/test/sandbox` directory.

## CLI Debugging Options

**`--debug`**

The following will enable debug mode and show debug specific logs.

```bash
plugma --debug
```

**`--config`**

The following will allow you to enable certain features still being developed.

```bash
plugma --config '{"runtimeData": {"iframeMode": "scrDoc"}}'
```

## Submitting Changes

The maintainers will review your pull request and provide feedback if needed. Once approved, your helper will be merged into the library.
