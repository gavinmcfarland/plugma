# Getting started

Plugma is powerful command-line interface that's designed to streamline your development workflow, making it easier to create, build, and manage your plugins.

### Installation

To create a new plugin, run the following command in your terminal and follow the prompts.

```bash
npm create plugma@latest
```

It will ask you to pick a framework you want your plugin to be created with.

```bash
? Select a framework:
❯ Vanilla
  Svelte
  React
  Vue
```

After this, change directory to the project and install the dependencies.

```bash
cd my-plugin
npm install
```

### Basic usage

Once installed, you can start developing your plugin.

```bash
npm run dev -- -p 3000
```
