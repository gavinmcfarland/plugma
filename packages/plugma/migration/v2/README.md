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
