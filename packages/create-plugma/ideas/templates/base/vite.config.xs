import { defineConfig } from "vite";
<%- framework.plugins.map(plugin => `import { ${plugin.name} } from "${plugin.import}";`).join('\n') %>

// https://vite.dev/config/
export default defineConfig(({ context }) => {
	return {
		plugins: context === 'ui' ? [ <%- framework.plugins.map(plugin => `${plugin.name}()`).join(', ') %> ] : []
	};
});
