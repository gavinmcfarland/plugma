import type { Plugin } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Event listeners must be injected before tests are registered
export function injectEventListeners(mainEntry: string): Plugin {
	return {
		name: 'inject-event-listeners',
		enforce: 'post',
		transform(code, id) {
			// Only transform the entry point
			if (!id.includes(mainEntry)) {
				return null
			}

			// Inject event listeners at the top of the bundle
			const eventListeners = `import { initializeTestHandlers } from '${__dirname}/../../testing/figma/handlers';\ninitializeTestHandlers();`

			// console.log('🔄 Injecting event listeners:', `${eventListeners}\n${code}`)
			return {
				code: `${eventListeners}\n${code}`,
				map: null,
			}
		},
	}
}
