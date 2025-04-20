# Bundling Options

Plugma uses Vite to bundle both your plugin's main code and UI code. This guide explains how to configure the bundling process.

## Basic Configuration

You can configure bundling options by creating one or both of these files in your project root:

- `vite.config.ui.js` - For UI code configuration
- `vite.config.main.js` - For main process configuration

## Environment-Specific Configuration

You can set different bundling options based on the environment (development, production, testing) using the `mode` parameter:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
	plugins: [react()],
	minify: mode === 'testing' ? true : false
}));
```

## Customizing the UI Template

By default, Plugma provides an HTML template for your UI. You can override this by creating an `index.html` file in your project root:

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

Important: Make sure to include the `<!--[ PLUGIN_UI ]-->` placeholder, this is where Plugma will inject your UI code.
