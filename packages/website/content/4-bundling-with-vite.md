# Bundling with Vite

Vite is used to bundle both the main code and the UI. To configure how this works you can can modify the `vite.config.js` file in the route of your project.

##### Example vite.config.js file

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({mode}) => {
	plugins: [react()],
    minify: mode === 'testing' ? true : false
});
```
