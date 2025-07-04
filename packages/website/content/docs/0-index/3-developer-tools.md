# Developer tools

Plugma comes with several tools to make developing plugins easier, with more coming soon.

## Developer toolbar

The developer tool bar allows you to open the browser preview, minimise the plugin window and clear `clientStorage` and `pluginData`. You can open the developer toolbar by clicking into the plugin window and pressing <kbd>Opt</kbd> + <kbd>Cmd</kbd> + <kbd>J</kbd>.

- **Websockets URL button**: With websockets enabled you can click on the websockets connection icon to open the browser preview.
- **Minimise plugin window**: When you don't want the plugin window to get in the way of your canvas you can minimise the plugin window by clicking the "Minimise window" option from the more menu.
- **Delete clientStorage**: Plugma makes it convenient to delete `clientStorage` while deverloping by clicking the "Delete client storage" option from the more menu.
- **Delete root pluginData**: Often data is stored as `pluginData` on the document in cases where its specific to the file. to delete this data click "Delete root PluginData" from the more menu.

## Source Maps

By default source maps are enabled in `dev` mode.

Source maps help you debug your Figma plugin by mapping the code running in the plugin (which is often minified or bundled) back to your original source code. This makes it easier to trace errors and understand what your code is doing during development.

### Viewing Source Maps

1. Open your plugin in Figma.
2. Use Developer Tools (Cmd + Option + I on Mac, Ctrl + Shift + I on Windows).
3. When an error occurs or you add a console.log, the file paths and line numbers should match your source code.

### Using Workspaces to Edit Files

If you want to edit your source files directly from Chrome DevTools and have breakpoints persist across reloads.

1. Open DevTools → Sources → Filesystem tab.
2. Click "Add folder" and select your plugin’s root directory.
3. Grant permission to read/write the files.
4. Chrome will now link the source maps to your actual files on disk, allowing you to edit them live during development.

> If you're developing in the browser, Chrome will suggest adding your workspace automatically.
