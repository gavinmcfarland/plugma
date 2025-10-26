import type { ViteDevServer } from 'vite'
import type { RollupWatcher } from 'rollup'
import type { BuildWatcherWrapper } from '../tasks/build-ui.js'

class InstanceManager<T extends { close(): Promise<void> }> {
	private _instance: T | undefined

	async setInstance(instance: T) {
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
	/** Build-specific Vite watcher manager */
	viteMain: new InstanceManager<RollupWatcher>(),
	/** UI-specific Vite server manager */
	viteUi: new InstanceManager<BuildWatcherWrapper>(),
	/** Flag to track if a build is in progress */
	isBuilding: false,
	/** Queue of messages to process after build */
	messageQueue: [] as Array<{ message: string; senderId: string }>,
}
