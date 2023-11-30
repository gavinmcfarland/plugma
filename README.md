# Figma Svelte Template

> This template is still in development, use at your own risk.

Use this template to get started developing Figma plugins in Svelte.

## Features

-   Live Development Server: Develop your plugin UI by connecting the plugin window to a development server, eliminating the need to bundle your UI file during development.

-   Browser Preview: Test your plugin's UI in various browsers in real-time without needing to publish your file. Figma's CSS variables are automatically passed from Figma to your local development server for accurate style previews.

## Getting started

Create a new plugin or widget based on this template using [degit](https://github.com/Rich-Harris/degit).

```shell
npx degit fignite/svelte-template my-plugin
cd my-plugin
```

Then install the dependencies

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

## Folder Structure

```
lib/
    globals.ts
    DevelopmentWrapper.svelte
dist/
    code.js
    index.html
scr/
    main/
    styles/
    assets/
    views/
manifest.json
package.json
README.md
```
