# Browser preview

Plugma enables your plugin to run in the browser during development by using WebSockets for two-way communication between Figma and the plugin UI. For the browser preview to work, WebSockets must be enabled.

<blockquote class="warning">
If the plugin runs before the browser preview is open, any messages sent from the main thread at that time might be missed. To prevent this, wait for a “ready” message from the UI before sending messages.
</blockquote>

## Browser Testing

Figma plugins can run in the browser, but testing them across different browsers usually requires publishing first. Plugma changes that by letting you preview your plugin in the browser. This makes it easy to test manually in different environments, and it also enables automated testing tools like Playwright to verify your plugin works consistently across browsers.

To enable end-to-end testing in the browsers add Playwright as an integration with the following command.

```bash
npx plugma add playwright
```

## Enabling WebSockets

WebSockets must be enabled to preview in the browser. To enable WebSockets run the `dev` command with the `--websockets` option. Unline the preview command, this does not minimise the plugin by default.

```bash
npm run dev -- --websockets
```

## Preview command

Using the `preview` command will automatically enable WebSockets and open the plugin in Figma in a minimised state with a preview URL.

```bash
npm run preview

# Example output
Plugma v2.0.0
Preview: http://localhost:<port>
```
