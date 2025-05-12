/**
 * Cleanup utilities for task management
 */

import { ListrLogLevels } from 'listr2'
import { createDebugAwareLogger } from './debug-aware-logger.js'

const logger = createDebugAwareLogger()

const cleanupFunctions: (() => Promise<void>)[] = []

/**
 * Registers a cleanup function to be called when the process exits
 * @param fn - Async function to be called during cleanup
 */
export function registerCleanup(fn: () => Promise<void>): void {
	if (!cleanupFunctions.includes(fn)) {
		cleanupFunctions.push(fn)
	}
}

/**
 * Unregisters a cleanup function
 * @param fn - The cleanup function to unregister
 */
export function unregisterCleanup(fn: () => Promise<void>): void {
	const index = cleanupFunctions.indexOf(fn)
	if (index !== -1) {
		cleanupFunctions.splice(index, 1)
	}
}

/**
 * Executes all registered cleanup functions and clears the list
 */
export async function runCleanup(): Promise<void> {
	logger.log(ListrLogLevels.OUTPUT, 'Executing cleanup functions...')
	for (const fn of cleanupFunctions) {
		try {
			await fn()
		} catch (error) {
			logger.log(ListrLogLevels.FAILED, ['Error during cleanup:', error])
		}
	}
	cleanupFunctions.length = 0 // Clear the array
	logger.log(ListrLogLevels.OUTPUT, 'Cleanup complete')
}

// Handle process termination signals
process.on('SIGINT', async () => {
	logger.log(ListrLogLevels.OUTPUT, 'Received SIGINT. Cleaning up...')
	await runCleanup()
	process.exit(0)
})

process.on('SIGTERM', async () => {
	logger.log(ListrLogLevels.OUTPUT, 'Received SIGTERM. Cleaning up...')
	await runCleanup()
	process.exit(0)
})

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
	logger.log(ListrLogLevels.FAILED, ['Uncaught exception:', error])
	await runCleanup()
	process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
	logger.log(ListrLogLevels.FAILED, ['Unhandled promise rejection:', reason])
	await runCleanup()
	process.exit(1)
})
