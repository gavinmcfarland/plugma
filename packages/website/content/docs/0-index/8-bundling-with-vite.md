# Bundling with Vite

Plugma uses Vite to bundle both your plugin's main code and UI code. Bundling is the process of combining multiple files and dependencies into optimised, production-ready files. This guide explains how to configure the bundling process to suit your plugin's needs.

## Basic Configuration

You can configure plugma to use different bundling options for your plugin's main code and UI code. The simplest way is to use the `context` option in your `vite.config.js` file.

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode, context }) => (
    if (context === 'ui') {
		return {
			plugins: [react()]
		};
	}
}));
```

Alternative you can configure vite to use seperate files for `main` and `ui`.

- `vite.config.ui.js` - For UI code configuration
- `vite.config.main.js` - For main process configuration

## Environment-Specific

You can set different bundling options based on the environment (development, production, testing) using the `mode` parameter:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode, context }) => (
    // ...
    return {
        minify: mode === 'testing' ? true : false
    }
}));
```

## Customising the UI Template

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
