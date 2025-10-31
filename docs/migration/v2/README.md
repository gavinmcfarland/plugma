# Migrating from V1 to V2

Plugma v2 brings major improvements, including separated Vite configurations for main and UI contexts, first-class testing support with Vitest and Playwright, easy integration of tools via the `add` command, widget support, and production-like behaviour in development.

## Breaking changes

- `process.env` is no longer supported by default. See [Referencing Env Variables](#referencing-env-variables)
- `-ws, --websockets` is no longer supported. See [Command Line Changes](#command-line-changes)
- iframe origin is now `null` during development [Iframe Origin](#iframe-origin)
- window events behaviour now matches production [Window Events Behaviour](#window-events-behaivour)

## Required Changes

These changes are necessary for your plugin to work with Plugma v2 and future versions.

### Update your `manifest` file

This is either your `manifest.json` file or the `manifest` field in your `package.json`.

Remove Plugma specific `devAllowedDomains`. These are now added automatically.

```diff
"networkAccess": {
    // ...
-   "devAllowedDomains": [
-       "http://localhost:*",
-       "ws://localhost:9001",
-   ]
}
```

### Update your `vite.config` file

You should now define what config Vite uses for the `main` and the `ui` context. You can do this using the `context` parameter.

```diff
export default defineConfig(({ context }) => {
	return {
-       plugins: [react()],
+		plugins: context === 'ui' ? [react()] : [],
	}
})
```

<!--
Alternatively you can create seperate files for the `main` and `ui` context, named respectively:

- `vite.config.main.ts`
- `vite.config.ui.ts`
-->

### Adding Support for `env` Types (recommended)

If you're using TypeScript, you can add a reference for the new context parameter type definition at the top of the file by adding the following `vite-env.d.ts` to the `src` directory of your plugin.

```ts
/// <reference types="vite/client" />

import 'vite';
import type { UserConfigExport } from 'vite';

declare module 'vite' {
    interface ConfigEnv {
        context?: 'ui' | 'main';
    }

    // Overload defineConfig to acknowledge the context parameter
    function defineConfig(config: (env: ConfigEnv) => UserConfigExport): UserConfigExport;
}
```

Then reference it at the top of your `vite.config.ts` file.

```ts
/// <reference path="./src/vite-env.d.ts" />
```

### Referencing Env variables

This applies only if you were referencing environment variables in your main code using `process.env`.

All environment variables used by Plugma must be prefixed with `VITE_` and referenced using the `import.meta.env` object. The `VITE_` prefix is required to mark these variables as exposed to the client explicitly. This applies to both main-thread and UI code, because even though main-thread code doesn't render in the UI, it still runs in the client context where the bundled code is exposed and can be inspected.

#### Example changes required

```diff
// .env
- SOME_KEY=123
+ VITE_SOME_KEY=123
```

```diff
// main.js
- console.log(process.env.SOME_KEY)
+ console.log(import.meta.env.VITE_SOME_KEY)
```

### Iframe Origin

The iframe origin of the plugin has been updated to `null` to match what is used in production. If you relied on this during development the workaround is to use a local development server that supports cross origin for development purposes.

### Window Events Behaivour

In Plugma V1, some events, like drop events—didn't work the same in development as they did in production. This was because the UI was hosted on an external server. Now, Plugma still uses a server, but the UI is embedded directly using a data URI, which better matches how plugins run in production.

### Command Line Changes

These changes only affect users who were using specific features in v1. If you weren't using these features, you can skip this section.

- WebSocket support is now enabled by default. If you were using the `-ws, --websockets` flag, you can remove it as it's no longer needed. If you need to disable WebSocket support, you can use the new `--no-websockets` flag.
    
## Other Notable Updates

## New CLI Wizard

The `create-plugma` cli has been completely revamped to support the following:

- You can now create widgets
- Brand new CLI that's more intuitive and guides you through the process
- A new and recommended file organisation for plugins and widgets
- Ability to add integrations
- Option to install dependencies with your preferred package manager

```bash
npm create plugma@latest
```

### Add Integrations

You can now integrate new third-party libraries and tools using the following:

```bash
npm create plugma@latest add
```

These include:

- Prettier
- Tailwind
- ESLint
- Shadcn
- Vitest (experimental)
- Playwright (experimental)

Each integration will automatically scaffold the necessary files and configuration, sparing you the manual setup.

### Type-safe manifest file

You can now manage your manifest in a TypeScript file.

```ts
import { defineManifest } from 'plugma';

export default defineManifest({
    id: 'com.my-plugin',
    name: 'My Plugin',
    api: '1.0.0',
    main: 'src/main.ts',
    ui: 'src/ui.ts',
    editorType: ['figma', 'figjam'],
    networkAccess: {
        allowedDomains: ['none'],
    }
);
```

### Custom `index.html` Entry Point

By default, Plugma uses its own index template for the UI process. However, you can use your own template by adding an `index.html` file to the root of your project.

Just make sure to include the <!--[ PLUGIN_UI ]--> placeholder where the Plugma generated UI code will be injected.

**Example**

```html
<html>
    <head>
        <title><!--[ PLUGIN_NAME ]--></title>
    </head>
    <body>
        <div id="app"></div>
        <!--[ PLUGIN_UI ]-->
    </body>
</html>
```
