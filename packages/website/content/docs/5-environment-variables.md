# Environment variables

Plugma supports environment variables by loading `.env` files located in the root of your project. When setting environment variables for use in the `ui` code, they must be prefixed with `VITE_` to be exposed to the UI.

## `.env` Files

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
VITE_API_KEY=123456789
```
