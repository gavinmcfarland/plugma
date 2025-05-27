import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ context }) => {
	return {
		plugins: context === 'ui' ? [vue()] : [],
	}
})
