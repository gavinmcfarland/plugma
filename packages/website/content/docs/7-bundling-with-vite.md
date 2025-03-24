# Bundling with Vite

Vite is used to bundle both the main code and the UI code.

## Configuration

To configure the bundling options for UI and main processes you can use a `vite.config.ui.js` file for the UI code and/or a `vite.config.main.js` file for the main code in the root of your project

### Mode specific configuration

Configure different options for different modes by passing in the `mode` parameter to the callback function in the `defineConfig` function.

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({mode}) => {
	plugins: [react()],
    minify: mode === 'testing' ? true : false
});
```

<!-- Using a single `vite.config.js` file you can use the `runtime` option to specify different configurations for UI and main during build time.

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

### Separate Configuration Files -->

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
