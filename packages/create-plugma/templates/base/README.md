# <%- name %>

<%- block('description') %>

## Quickstart

This <%- type %> was created with [Plugma](https://github.com/gavinmcfarland/plugma)<% if (framework) { %> using the [<%- framework.charAt(0).toUpperCase() + framework.slice(1) %>](https://svelte.dev/) framework<% } %>.

### Requirements

- [Node.js](https://nodejs.org/en)
- [Figma desktop app](https://www.figma.com/downloads/)

### Build and Import

1. Install the dependencies and build the <%- type %> to `dist/`:

    ```bash
    <%- installCommand || 'npm install' %>
    <%- buildCommand || 'npm run build' %>
    ```

2. Open the Figma desktop app and import the built <%- type %>:

    - Open a file in Figma.
    - Press `Cmd/Ctrl + K` to open the [Actions](https://help.figma.com/hc/en-us/articles/23570416033943-Use-the-actions-menu-in-Figma-Design) menu.
    - Search for _"Import <%- type %> from manifest..."_
    - Select `dist/manifest.json` (not the root one).

To update <%- type %> details, edit `./manifest.json` in the project root.

### Developing

Run the dev server to watch for changes and rebuild automatically.

```bash
pnpm dev
```

While the dev server is running:

- Files are recompiled into `dist/` on save.
- The plugin UI hot-reloads instantly.
- Edits to `./manifest.json` sync to the generated `dist/manifest.json`.
- A browser preview is available from the link shown in the terminal (plugin UI must be open in Figma).


### Before Publishing

Before publishing your plugin from the desktop app, run a production build to ensure it no longer points to the dev server.

### Integrations

Add integrations to extend your <%- type %> with common tools and frameworks.

```bash
npm create plugma@latest add
```

### Advanced

See the [Plugma docs](https://plugma.dev/docs) for more information.

<% if (attribution) { %>

### Attribution

<%- attribution %>
<% } %>
