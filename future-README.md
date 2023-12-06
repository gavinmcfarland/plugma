# Readme

Use this framework to spead up creating plugins in any framework.

## Features

-   Live Development Server: Develop your plugin UI by connecting the plugin window to a development server, eliminating the need to bundle your UI file during development.

-   Browser Preview: Test your plugin's UI in various browsers in real-time without needing to publish your file. Figma's CSS variables are automatically passed from Figma to your local development server for accurate style previews.

```shell
npm create plugma@latest my-plugin
```

Then follow the prompts.

Once a template has been copied across:

```shell
cd my-plugin
npm install
npm run build
```

## Folder Structure

```
dist/
    main.js
    ui.html
scr/
    App.svelte
    main.ts
    ui.ts
    styles.css
vite.config.ts
package.json
README.md
```

## Common Plugin Architecture

The main code will be exported as a function, allowing us to easily wrapp around the users code. This method provides dynamic functionality by enabling switching between compiled HTML and a local development server to load the UI. Moreover, this function facilitates the passing of objects to the plugin, usable by the user within the main code.

```js
import * as Plugin from "./scr/main.ts";


if (process.env.NODE_ENV === "development") {
    let __html__ = "";
    let htmlString = "";

        htmlString = html`<html id="app"></html>
        <script>
        // Grab figma styles before loading local dev url
        const styleSheet = document.styleSheets[0];
        const cssRules = styleSheet.cssRules || styleSheet.rules
        parent.postMessage({
            pluginMessage: {
                event: "save-figma-styles",
                styles: document.styleSheets[0].cssRules[0].cssText
            }
        }, "https://www.figma.com")
        window.location.href = 'http://localhost:5173'
        </script>`;
    }
    __html__ = htmlString;

    figma.ui.onmessage = async (msg) => {
		if (msg.event === "save-figma-style") {
			figma.clientStorage.setAsync("figma-styles", msg.styles);
		}
		if (msg.event === "get-figma-styles") {
			let styles = await figma.clientStorage.getAsync("figma-styles");
			figma.ui.postMessage({ event: "receive-figma-styles", styles });
		}
	};
}

Plugin()
```

The UI will then receive the styles.

```js
    // getFigmaStyles.ts
    parent.postMessage(
		{
			pluginMessage: {
				event: "get-figma-styles",
			},
			pluginId: "*",
		},
		"*",
	);

    // recevie-figma-styles

	function onWindowMsg(msg: any) {
		// We listen for message to add figma styles during development
		const message = msg.data.pluginMessage;
		if (message && message.event === "recieve-figma-styles") {
			document.styleSheets[0].insertRule(message.styles);
			window.removeEventListener("message", onWindowMsg);
		}
	}

	window.addEventListener("message", onWindowMsg);
```

## Better messaging

```js
// ui.ts
emit("get-figma-styles", (data) => {
    // Add styles to document
});
```

```js
on('get-figma-styles', (data) => {
    // Post styles to UI
    let res = await figma.clientStorage.getAsync("figma-styles");
    figma.postMessage('get-figma-styles?', res) // Not sure if this works, what event name does it pass?
})

rebound('get-figma-styles', () => {
    // Post styles to UI
    retun await figma.clientStorage.getAsync("figma-styles");
})
```
