import type { ViteDevServer } from 'vite'
import type { RollupWatcher } from 'rollup'
import type { BuildWatcherWrapper } from './build-ui.js'

class UIServerManager {
	private _instance: BuildWatcherWrapper | undefined

	async setInstance(instance: BuildWatcherWrapper) {
		await this.close()
		this._instance = instance
	}

	get instance() {
		return this._instance
	}

	async close() {
		if (this._instance) {
			await this._instance.close()
			this._instance = undefined
		}
	}
}

/**
 * Shared Vite server state to manage server instances and build queue
 */
export const viteState = {
	/** Main Vite development server */
	viteServer: null as ViteDevServer | null,
	/** Build-specific Vite watcher */
	viteMainWatcher: null as RollupWatcher | null,
	/** UI-specific Vite server manager */
	viteUi: new UIServerManager(),
	/** Flag to track if a build is in progress */
	isBuilding: false,
	/** Queue of messages to process after build */
	messageQueue: [] as Array<{ message: string; senderId: string }>,
}
