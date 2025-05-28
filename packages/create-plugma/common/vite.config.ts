import { defineConfig } from "vite";
<%- framework.imports %>

// https://vite.dev/config/
export default defineConfig(({ context }) => {
	return {
		plugins: <%- framework.plugins %>
	};
});
