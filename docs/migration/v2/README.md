# Migrating to v2

Plugma v2 fixes bugs and adds a new testing feature.

## Updating Plugma dependecy

To install the beta version of the `plugma` dependency run:

```
npm install plugma@next
```

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

You should now define what config vite uses for the `main` and the `ui` context. You can do this using the `context` parameter.

```diff
export default defineConfig(({ context }) => {
	return {
-       plugins: [react()],
+		plugins: context === 'ui' ? [react()] : [],
	}
})
```

If you're using TypeScript you can add a reference for the new context paramater type definition at the top of the file. (coming soon)

```diff
/// <reference path="./vite.plugma.d.ts" />
```

Alternatively you can create seperate files for the `main` and `ui` context, named respectively:

- `vite.config.main.ts`
- `vite.config.ui.ts`

### Command Line Changes

These changes only affect users who were using specific features in v1. If you weren't using these features, you can skip this section.

- WebSocket support is now enabled by default. If you were using the `--websockets` flag, you can remove it as it's no longer needed. If you need to disable WebSocket support, you can use the new `--no-websockets` flag.
- The `preview` command has been removed. If you were using this command, you should now use `dev --dock-plugin` instead.

## Optional Changes

These changes are completely optional and can be implemented if you want to take advantage of new features.

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
