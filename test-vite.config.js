import { defineConfig } from "vite";

// Old style config without context parameter - should trigger warning
export default defineConfig({
    plugins: [],
});
