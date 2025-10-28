# <%- name %>

<%- block('description') %>

## Quickstart

This <%- type %> was created with [Plugma](https://github.com/gavinmcfarland/plugma)<% if (framework) { %> using the [<%- framework.charAt(0).toUpperCase() + framework.slice(1) %>](<%- frameworkUrl %>) framework<% } %>.

### Requirements

* [Node.js](https://nodejs.org/en)
* [Figma desktop app](https://www.figma.com/downloads/)

### Develop and Import

1. Install dependencies and start the dev server:

   ```bash
   <%- installCommand || 'npm install' %>
   <%- devCommand || 'npm run dev' %>
   ```

   Changes are automatically rebuilt to `dist/` on save.

2. In the Figma desktop app:

   * Open a file.
   * Press `Cmd/Ctrl + K` to open the [Actions menu](https://help.figma.com/hc/en-us/articles/23570416033943-Use-the-actions-menu-in-Figma-Design).
   * Search for **“Import <%- type %> from manifest…”**
   * Select `dist/manifest.json`.

After importing, open the Actions menu again to find and run your <%- type %>.
Keep the dev server running for instant reloads while testing in Figma.

Edit `./manifest.json` in the project root to update your <%- type %> details.

### Before Publishing

When your <%- type %> is ready to publish, create a production build.
This optimizes and minifies your code, and ensures the output no longer points to the dev server.

```bash
<%- buildCommand || 'npm run build' %>
```

The build in `dist/` is now ready to upload via the Figma desktop app.

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
