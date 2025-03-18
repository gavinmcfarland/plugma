# Bundling with Vite

Vite is used to bundle both the main process code and the UI code. You have several options for configuring how this works:

Using a single `vite.config.js` file you can use the `runtime` option to specify different configurations for UI and main during build time.

##### Example vite.config.js

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode, runtime }) => {
	if (runtime === 'ui') {
		return {
			plugins: [react()],
			build: {
				// UI-specific build options
			}
		};
	}

	if (runtime === 'main') {
		return {
			build: {
				// Main process-specific build options
			}
		};
	}
});
```

### Separate Configuration Files

Alternatively you can use distinct configuration files for UI and main processes during build time, specifically `vite.config.ui.js` for UI and `vite.config.main.js` for main.
