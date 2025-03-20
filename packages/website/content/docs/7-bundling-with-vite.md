# Bundling with Vite

Vite is used to bundle both the main process code and the UI code.

## Configuration Options

Using a single `vite.config.js` file you can use the `runtime` option to specify different configurations for UI and main during build time.

<blockquote class="warning">
Runtime option coming soon.
</blockquote>

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

<blockquote class="warning">
Separate configuration files coming soon.
</blockquote>

## Custom index template

By default Plugma uses it's own index template for the UI process. However you can use your own template by adding a `index.html` file to the root of your project.

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

Just make sure to include the `<!--[ PLUGIN_UI ]-->` placeholder where the Plugma generated UI code will be injected.
