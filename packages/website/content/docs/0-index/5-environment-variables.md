# Environment variables

Plugma supports environment variables by loading `.env` files located in the root of your project.

## Configuring `.env` files

Plugma will load the following .env files from your project root.

```bash
.env                # loaded in all cases
.env.local          # loaded in all cases, ignored by git
.env.[mode]         # only loaded in specified mode
.env.[mode].local   # only loaded in specified mode, ignored by git
```

For instance, if you are using a `development` mode, `.env.development` and `.env.development.local` (if available) will be loaded.

## Setting modes

To specify the environment mode, pass the `--mode` option to the command. By default, `plugma dev` runs in `development` mode, and `plugma build` runs in `production` mode.

Specifying a custom mode allows for tailored environment setups, such as testing configurations, without committing sensitive data to GitHub. For example, running `plugma dev --mode testing` will load variables from `.env.testing` and, if present, `.env.testing.local`.

```bash
# .env.testing.local
VITE_SOME_KEY=123456789
```

## Referencing environment variables

To reference environment variables in your code, use `import.meta.env.VITE_SOME_KEY`. Variables must begin with `VITE_`, this is to prevent accidentally leaking env variables to the browser client.

#### Example

```js
console.log(import.meta.env.VITE_SOME_KEY);
```

<blockquote class="warning">
Environment variables must be prefixed with VITE_ to be exposed to the client code. Be mindful that these values are bundled with the plugin and can be discovered by inspecting the bundled source code where the plugin runs inside Figma, even if used only in the main thread.
</blockquote>

<blockquote class="info">
`.env` files are loaded when Plugma starts. Restart the command after making changes.
</blockquote>

## Further documentation

For more information see [Vite: Env Variables and Modes](https://vite.dev/guide/env-and-mode).
