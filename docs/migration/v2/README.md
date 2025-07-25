# Migrating from v1 to v2

Plugma v2 fixes bugs and introduces a new add-on feature.

## Updating Plugma Dependecy

To install the beta version of the `plugma` dependency run:

```
npm install plugma@next
```

## Required Changes

These changes are necessary for your plugin to work with Plugma v2 and future versions.

### Referencing env variables (breaking change)

This only applies if you were referencing envariables inside you main code using `process.env`.

All environment variables used by Plugma must not be prefixed with `VITE_` and referenced using the `import.meta.env` object. This is because variables prefixed with `VITE_` are exposed to the client which can be discovered by inspecting the bundled source code where the plugin runs inside Figma, even if used only in the main thread.

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

You should now define what config vite uses for the `main` and the `ui` context. You can do this using the `context` parameter.

```diff
export default defineConfig(({ context }) => {
	return {
-       plugins: [react()],
+		plugins: context === 'ui' ? [react()] : [],
	}
})
```

Alternatively you can create seperate files for the `main` and `ui` context, named respectively:

- `vite.config.main.ts`
- `vite.config.ui.ts`

### Adding Support for `env` Types (recommended)

If you're using TypeScript you can add a reference for the new context paramater type definition at the top of the file by adding the following `vite-env.d.ts` to the `src` directory of your plugin.

```ts
/// <reference types="vite/client" />

import 'vite'
import type { UserConfigExport } from 'vite'

declare module 'vite' {
    interface ConfigEnv {
        context?: 'ui' | 'main'
    }

    // Overload defineConfig to acknowledge the context parameter
    function defineConfig(config: (env: ConfigEnv) => UserConfigExport): UserConfigExport
}
```

Then reference it at the top of your `vite.config.ts` file.

```ts
/// <reference path="./src/vite-env.d.ts" />
```

### Command Line Changes

These changes only affect users who were using specific features in v1. If you weren't using these features, you can skip this section.

- WebSocket support is now enabled by default. If you were using the `-w, --websockets` flag, you can remove it as it's no longer needed. If you need to disable WebSocket support, you can use the new `--no-websockets` flag.
- The `preview` command has been deprecated. If you were using this command, you should now use `dev --dock-plugin` instead.

## Optional

These changes are completely optional and can be implemented if you want to take advantage of new features.

### Type-safe manifest file

You can now manage your manifest in a TypeScript file.

> This feature is still under development, so changes may not always trigger a plugin reload while it’s running.

```ts
import { defineManifest } from 'plugma/utils'

export default defineManifest(() => {
    return {
        id: 'com.my-plugin',
        name: 'My Plugin',
        api: '1.0.0',
        main: 'src/main.ts',
        ui: 'src/ui.ts',
        editorType: ['figma', 'figjam'],
        networkAccess: {
            allowedDomains: ['none'],
        },
    }
})
```

### Custom `index.html` Entry Point

- Add support for custom `index.html` template

    By default Plugma uses it's own index template for the UI process. However you can use your own template by adding a `index.html` file to the root of your project.

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

### New Intergrations

You can now integrate new third party libraries and tools using the following:

```bash
npx plugma add
```

These include:

- Tailwind (figma variables coming soon)
- ESlint (with Figma specific rules)
- Vitest (experimental)
- Playwright (experimental)
- Shadcn (coming soon)

Each integration will automatically scaffold the necessary files and configuration, sparing you the manual setup. They’re still being refined, but they’ll cover most of what you need to get started.
