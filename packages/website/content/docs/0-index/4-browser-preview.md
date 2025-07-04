# Browser preview

Plugma enables your plugin to run in the browser during development by using WebSockets for two-way communication between Figma and the plugin UI. Developing Figma plugins traditionally requires testing within the Figma desktop app, which has several limitations. Browser preview changes this by allowing you to develop and test your plugin in any browser while maintaining full communication with Figma.

<blockquote class="warning">
If the plugin runs before the browser preview is open, any messages sent from the main thread at that time might be missed. To prevent this, wait for a "ready" message from the UI before sending messages.
</blockquote>

## Testing

Figma plugins can run in the browser, but testing them across different browsers usually requires publishing first. Plugma changes that by letting you preview your plugin in the browser. This makes it easy to test manually in different environments, and it also enables automated testing tools like Playwright to verify your plugin works consistently across browsers.

To enable end-to-end testing in the browsers add Playwright as an integration with the following command.

```bash
npx plugma add playwright
```
