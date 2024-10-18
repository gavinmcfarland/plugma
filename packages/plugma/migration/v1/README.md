# Migration Guide v1

Version 1 of Plugma introduces a new way to apply Vite's configuration, simplifying your vite.config.js setup. Previously, Plugma required you to reference its internal Vite configuration file. Now, the configuration is applied programmatically, eliminating the need for extra imports and merging configurations. This results in a cleaner and more maintainable configuration file.

## Changes You Need to Make

If your current `vite.config.js` file looks like this:

```js
/** @type {import('vite').UserConfig} */

import { svelte } from '@sveltejs/vite-plugin-svelte'
import baseConfig from 'plugma/lib/vite.config.js'
import { defineConfig, mergeConfig } from 'vite'

export default defineConfig(
    mergeConfig(baseConfig, {
        plugins: [svelte()],
    }),
)
```

You can update it to the following for Plugma v1.x.x:

```js
/** @type {import('vite').UserConfig} */

import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig(() => {
    return {
        plugins: [svelte()],
    }
})
```

## Why the change?

In v1.x.x, Plugma automatically applies its necessary Vite settings internally. This change removes the need for importing and merging configuration files like `plugma/lib/vite.config.js`. As a result, your vite.config.js will focus solely on your project's specific plugins and settings, making the file more concise and easier to manage.
