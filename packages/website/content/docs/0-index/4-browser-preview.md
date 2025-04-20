# Browser preview

Plugma enables your plugin to run in the browser during development by using WebSockets for two-way communication between Figma and the plugin UI. For the browser preview to work, WebSockets must be enabled.

This feature is helpful because Figma plugins can run in the browser, and currently, the only way to test your plugin across different browsers is by publishing it.

<blockquote class="warning">
Due to a current limitation, if the plugin runs when the browser preview isn’t open, messages from the main thread may be missed. To avoid this, wait until the UI has loaded before sending messages to it. You can do this by listening for a message from the UI indicating it is ready.
</blockquote>

## Enabling WebSockets

##### `preview`

Using the `preview` command will automatically enable WebSockets and open the plugin in Figma in a minimised state with a preview URL.

```bash
npm run preview

# Example output
Plugma v1.0.0
Preview: http://localhost:<port>
```

##### `dev -ws`

Alternatively, you can run the `dev` command with the `-ws` option. Unlike preview, this option does not minimise the plugin by default.

```bash
npm run dev -- -ws
```
