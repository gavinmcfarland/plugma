# Migrating to v2

Plugma v2 fixes bugs and adds a new testing feature. The only required update is changing the websocket connection port number. To support the new testing features, additional changes are needed.

## Changes you must make

### Update your `manifest` file

This is either your `manifest.json` file or the `manifest` field in your `package.json`.

-   Change the websocket port to a wildcard

    ```diff
    "networkAccess": {
        // ...
        "devAllowedDomains": [
            "http://localhost:*",
    -       "ws://localhost:9001",
    +       "ws://localhost:*"
        ]
    }
    ```

## Changes to support testing

-   Add a `test` script to your `package.json`.

    ```diff
    "scripts": {
        //...
    +    "test": "plugma test"
    }
    ```

-   Create a test file ending in `.test.`.

    ```ts
    import { test, expect } from "plugma/testing";

    test("My test", async ({ page }) => {});
    ```
    
## Changes to support custom `index.html` template

By default Plugma uses it's own index template for the UI process. However you can use your own template by adding a `index.html` file to the root of your project.

Just make sure to include the <!--[ PLUGIN_UI ]--> placeholder where the Plugma generated UI code will be injected.

**Example**

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
