# Migrating to v1

Plugma v1 introduces a simpler way to manage Vite configurations. Before, you had to import and merge Plugma's config with your own, adding extra steps. Now, Plugma automatically applies its configuration, keeping your vite.config.js simpler and cleaner.

Also, Plugma v1 uses Vite to bundle the main code, so you can configure both the main code and UI in the same vite.config.js.

## What You Need to Update

Inside your `vite.config.js` you need to update the following:

```js
 /** @type {import('vite').UserConfig} */

 import { svelte } from '@sveltejs/vite-plugin-svelte'
-import baseConfig from 'plugma/lib/vite.config.js'
-import { defineConfig, mergeConfig } from 'vite'
+import { defineConfig } from 'vite'

-export default defineConfig(
-    mergeConfig(baseConfig, {
-        plugins: [svelte()],
-    }),
-)
+export default defineConfig(() => {
+    return {
+        plugins: [svelte()], // Only include your specific plugins here
+    }
+})
```

If you prefer, when you update from v0.x.x to v1.x.x, the CLI will provide an option to automatically migrate these changes for you.
