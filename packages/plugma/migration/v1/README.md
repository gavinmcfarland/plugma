# Migrating to v1

Plugma v1 introduces a simpler way to manage Vite configurations. Before, you had to import and merge Plugma's config with your own, adding extra steps. Now, Plugma automatically applies its configuration, keeping your vite.config.js simpler and cleaner.

Also, Plugma v1 uses Vite to bundle the main code, so you can configure both the main code and UI in the same vite.config.js.

## Changes you need to make

Inside your `vite.config.js` update the following:

-   Remove Plugma's Vite config import

    ```diff
    -import baseConfig from 'plugma/lib/vite.config.js'
    ```

-   Remove the mergeConfig import

    ```diff
    -import { defineConfig, mergeConfig } from 'vite'
    +import { defineConfig } from 'vite'
    ```

-   And then finally return the config in a callback

    ```diff
    -export default defineConfig(
    -    mergeConfig(baseConfig, {
    -        plugins: [svelte()],
    -    }),
    -)
    +export default defineConfig(({mode, platform}) => {
    +    return {
    +        plugins: [svelte()], // Only include your specific plugins here
    +    }
    +})
    ```

If you prefer, when you update from v0.x.x to v1.x.x, the CLI will provide an option to automatically migrate these changes for you.
