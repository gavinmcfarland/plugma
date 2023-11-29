# Figma Svelte Template

> This template is a work in progress.

Use this template to get started developing Figma plugins in Svelte.

## Features

-   Develop faster by using a local server for development
-   Bundle into inlined `code.js` and `ui.html` files when you want to publish
-   Use the `dev:server` option to preview your plugin in the browser

## Getting started

Create a new plugin or widget based on this template using [degit](https://github.com/Rich-Harris/degit).

```shell
npx degit fignite/svelte-template my-plugin
cd my-plugin
```

Then install the dependencies.

```shell
npm install
```

To create a build for production

```shell
npm run build
```

To develop

```shell
npm run dev
```

To develop in different browsers (needs fixing)

```shell
npm run dev:server
```
