# Migrating from V0 to V1

Plugma v1 makes managing Vite configurations much simpler. Previously, you had to import and merge Plugma’s configuration with your own, adding extra steps. Now, Plugma automatically applies its setup, keeping your vite.config.js clean and straightforward. With Vite now bundling both the main code and UI, you can manage all configurations in a single vite.config.js. Note that you’ll need to update the mount configuration in your ui file for your specific framework, as Plugma will no longer handle these configurations automatically in the future.

## Required Changes

### Update your vite.config.js file

When you update from v0.x.x to v1.x.x, the CLI can automatically migrate these changes for you. However if you prefer to do it manually, here’s what you need to update in `your vite.config.js` file.

- Remove Plugma's Vite config import

    ```diff
    -import baseConfig from 'plugma/lib/vite.config.js'
    ```

- Remove the mergeConfig import

    ```diff
    -import { defineConfig, mergeConfig } from 'vite'
    +import { defineConfig } from 'vite'
    ```

- And then finally return the config directly in a callback

    ```diff
    -export default defineConfig(
    -    mergeConfig(baseConfig, {
    -        plugins: [svelte()],
    -    }),
    -)
    +export default defineConfig(({mode}) => {
    +    return {
    +        plugins: [svelte()],
    +    }
    +})
    ```

    The callback will allow you to specify the mode (development, build etc).

#### Example with v1

Below is an example of what it should look like.

```js
/** @type {import('vite').UserConfig} */

// Remember to replace with the correct plugin for your framework
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig(() => {
    return {
        plugins: [svelte()],
    };
});
```

### Update configuration for framework

Each framework has its own configuration method. In Plugma V0, this was managed internally, but to give developers more control, Plugma will no longer handle these configurations. Update your ui file to manage framework setup. Current configurations are supported temporarily but will be deprecated in future versions.

Use the code snippets below to configure your application for each supported framework:

#### React

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';

createRoot(document.getElementById('app')).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
```

### Svelte 4

```js
import './styles.css'
import App from './App.svelte'

let app = new App({
    target: document.getElementById("app")!,
});

export default app;
```

### Svelte 5

```js
import { mount } from 'svelte';
import './styles.css';
import App from './App.svelte';

const app = mount(App, {
    target: document.getElementById('app'),
});

export default app;
```

### Vue

```js
import { createApp } from 'vue';
import './styles.css';
import App from './App.vue';

createApp(App).mount('#app');
```

### Vanilla JS/TS

```js
import App from './App.js';
import './styles.css';

document.querySelector('#app').innerHTML = App;
```

## Other changes

The `plugma dev` command longer enables websockets needed for the browser preview my default. To enable this you can use the `--websockets` (`-ws`) flag or the dedicated `plugma preview` command.

**Example**

```
plugma dev --ws
# or
plugma preview
```
