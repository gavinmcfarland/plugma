# Migrating to v1

Plugma v1 introduces a simpler way to manage Vite configurations. Before, you had to import and merge Plugma's config with your own, adding extra steps. Now, Plugma automatically applies its configuration, keeping your `vite.config.js` simpler and cleaner.

Also, Plugma v1 uses Vite to bundle the main code, so you can configure both the main code and UI in the same vite.config.js.

## Changes you need to make

When you update from v0.x.x to v1.x.x, the CLI can automatically migrate these changes for you. However if you prefer to do it manually, here’s what you need to update in `your vite.config.js` file.

-   Remove Plugma's Vite config import

    ```diff
    -import baseConfig from 'plugma/lib/vite.config.js'
    ```

-   Remove the mergeConfig import

    ```diff
    -import { defineConfig, mergeConfig } from 'vite'
    +import { defineConfig } from 'vite'
    ```

-   And then finally return the config directly in a callback

    ```diff
    -export default defineConfig(
    -    mergeConfig(baseConfig, {
    -        plugins: [svelte()],
    -    }),
    -)
    +export default defineConfig(({mode}) => {
    +    return {
    +        plugins: [svelte()],
    +    }
    +})
    ```

    The callback will allow you to specify the mode (development, build etc).

## Example with v1

Below is an example of what it should look like.

```js
/** @type {import('vite').UserConfig} */

// Remember to replace with the correct plugin for your framework
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig(() => {
    return {
        plugins: [svelte()],
    }
})
```

## Other changes

The `plugma dev` command longer enables websockets needed for the browser preview my default. To enable this you can use the `--websockets` (`-ws`) flag or the dedicated `plugma preview` command.

**Example**

```
plugma dev --ws
# or
plugma preview
```
