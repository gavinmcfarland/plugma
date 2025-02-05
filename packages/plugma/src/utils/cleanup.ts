/**
 * Cleanup utilities for task management
 */

import { Logger } from './log/logger.js';

const log = new Logger({ debug: false });
const cleanupFunctions: (() => Promise<void>)[] = [];

/**
 * Registers a cleanup function to be called when the process exits
 * @param fn - Async function to be called during cleanup
 */
export function registerCleanup(fn: () => Promise<void>): void {
  cleanupFunctions.push(fn);
}

/**
 * Executes all registered cleanup functions
 */
async function executeCleanup(): Promise<void> {
  log.debug('Executing cleanup functions...');
  for (const fn of cleanupFunctions) {
    try {
      await fn();
    } catch (error) {
      log.error('Error during cleanup:', error);
    }
  }
  log.debug('Cleanup complete');
}

// Handle process termination signals
process.on('SIGINT', async () => {
  log.info('Received SIGINT. Cleaning up...');
  await executeCleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log.info('Received SIGTERM. Cleaning up...');
  await executeCleanup();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  log.error('Uncaught exception:', error);
  await executeCleanup();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  log.error('Unhandled promise rejection:', reason);
  await executeCleanup();
  process.exit(1);
});
