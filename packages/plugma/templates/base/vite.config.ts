/// <reference path="./src/vite-env.d.ts" />

import { defineConfig } from "vite";
<%- typeof vite !== 'undefined' ? vite.plugins.map(plugin => {
	if (Array.isArray(plugin.name)) {
		return `import { ${plugin.name.join(', ')} } from "${plugin.import}";`;
	} else {
		return `import ${plugin.name} from "${plugin.import}";`;
	}
}).join('\n') : '' %>

// https://vite.dev/config/
export default defineConfig(({ context }) => {
	<% if (!hasUI) { %>
	return {};
	<% } else { %>
	return {
		plugins: context === 'ui' ? [<% if (typeof vite !== 'undefined') { %><%- vite.plugins.map(plugin => {
		const pluginName = Array.isArray(plugin.name) ? plugin.name[0] : plugin.name;
		return `${pluginName}()`;
	}).join(', ') %><% } %>] : []
	};
	<% } %>
});
