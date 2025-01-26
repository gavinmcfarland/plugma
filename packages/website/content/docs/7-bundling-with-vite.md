# Bundling with Vite

Vite is used to bundle both the main code and the UI. To configure how this works you can can modify the `vite.config.js` file in the root of your project.

<blockquote class="warning">
There’s a bug right now that stops you from overriding default config properties in Plugma. A fix is in the works, and updates will be shared once it’s sorted out.
</blockquote>

##### Example vite.config.js file

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({mode}) => {
	plugins: [react()],
    build: {
        minify: mode === 'testing' ? true : false
    }
});
```
