# Vitma

Vitma is a CLI to simplify creating plugins.

## To Get Started

```shell
npm create vitma@latest my-plugin
```

Choose a template you'd like to create a plugin from and then:

```shell
cd my-plugin
npm install
npm run build
```

## Features

-   ### Live Development Server
    By linking the plugin window to a development server it eliminates the need to rebuild the UI file repeatedly. This aids in debugging and streamlines the process.

---

-   ### Browser Preview

    Since it utilises a development server, you can try out your plugin's UI on different browsers, including previewing how it looks in both Figma's dark and light themes.

---

-   ### Consistant Folder Structure

    Vitma hides uneccesary boilerplate code so you can concentrate on the code required to develop your plugins.

## Helpers

-   ### Messaging

    -   #### `on(event, callback)`

        ##### Parameters

        -   **`event`** { String } the name of the event
        -   **`callback`** { Function }

    -   #### `emit(event, callback)`

        ##### Parameters

        -   **`event`** { String } the name of the event
        -   **`callback`** { Function } _Optional_ If provided, it will return the result from the event handler with the same event name.

## Configure

Vitma specific settings

```jsonc
// package.json
{
    "vitma": {
        "framework": "svelte"
    }
}
```

Figma specific settings

```jsonc
// manifest.json
{
    "main": "src/main.js",
    "ui": "src/ui.js"
}
```

## Plugin Folder Structure

Depending on which framework you choose, the files might vary slightly, but the file structure will remain the same.

```
.vite/
dist/
    main.js
    ui.html
scr/
    main.ts
    ui.ts
    App.jsx
    styles.css
manifest.json
vite.config.ts
package.json
README.md
```
