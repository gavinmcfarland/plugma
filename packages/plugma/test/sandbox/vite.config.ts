/// <reference path="./src/vite-env.d.ts" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ context }) => {
	return {
		plugins: context === 'ui' ? [react()] : [],
	};
});
