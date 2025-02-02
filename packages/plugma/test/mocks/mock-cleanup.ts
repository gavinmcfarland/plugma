/**
 * Test utilities for mocking cleanup functionality
 */

import { beforeEach, vi } from 'vitest';

// /**
//  * Creates a mock cleanup handler
//  * @returns Mock cleanup handler and tracking functions
//  */
// export function createMockCleanupHandler() {
//   let cleanupCount = 0;
//   let lastError: Error | null = null;

//   const handler = vi.fn(async () => {
//     cleanupCount++;
//     if (lastError) {
//       throw lastError;
//     }
//   });

//   return {
//     handler,
//     setError: (error: Error) => {
//       lastError = error;
//     },
//     clearError: () => {
//       lastError = null;
//     },
//     getCleanupCount: () => cleanupCount,
//     reset: () => {
//       cleanupCount = 0;
//       lastError = null;
//       handler.mockClear();
//     },
//   };
// }

type CleanupHandler = () => void | Promise<void>;

/**
 * Creates a mock process with signal handling
 * @returns Mock process and signal emitter
 */
export function createMockProcess() {
  const handlers: Record<string, CleanupHandler[]> = {
    SIGINT: [],
    SIGTERM: [],
    exit: [],
  };

  const mockProcess = {
    on: vi.fn((signal: string, handler: CleanupHandler) => {
      handlers[signal] = handlers[signal] || [];
      handlers[signal].push(handler);
    }),
    off: vi.fn((signal: string, handler: CleanupHandler) => {
      handlers[signal] = (handlers[signal] || []).filter((h) => h !== handler);
    }),
    exit: vi.fn(() => {
      for (const handler of handlers.exit) {
        handler();
      }
    }),
  };

  const emitSignal = async (signal: 'SIGINT' | 'SIGTERM') => {
    for (const handler of handlers[signal] || []) {
      await handler();
    }
  };

  return {
    process: mockProcess,
    emitSignal,
    getHandlerCount: (signal: string) => handlers[signal]?.length || 0,
    reset: () => {
      for (const key of Object.keys(handlers)) {
        handlers[key] = [];
      }
      mockProcess.on.mockClear();
      mockProcess.off.mockClear();
      mockProcess.exit.mockClear();
    },
  };
}

/**
 * Creates a mock cleanup registry
 * @returns Mock cleanup registry and tracking functions
 */
export function createMockCleanupRegistry() {
  const handlers = new Set<CleanupHandler>();
  let cleanupCount = 0;

  const register = vi.fn((handler: CleanupHandler) => {
    handlers.add(handler);
  });

  const unregister = vi.fn((handler: CleanupHandler) => {
    handlers.delete(handler);
  });

  const runCleanup = async () => {
    cleanupCount++;
    for (const handler of handlers) {
      await handler();
    }
  };

  return {
    register,
    unregister,
    runCleanup,
    getHandlerCount: () => handlers.size,
    getCleanupCount: () => cleanupCount,
    reset: () => {
      handlers.clear();
      cleanupCount = 0;
      register.mockClear();
      unregister.mockClear();
    },
  };
}

// Export a shared instance for use in tests
export const mockRegisterCleanup = vi.fn();
export const mockUnregisterCleanup = vi.fn();

// Mock the cleanup module
vi.mock('#utils/cleanup.js', () => ({
  registerCleanup: mockRegisterCleanup,
  unregisterCleanup: mockUnregisterCleanup,
}));

// Reset mocks before each test
beforeEach(() => {
  mockRegisterCleanup.mockClear();
  mockUnregisterCleanup.mockClear();
});

/**
 * Mock cleanup function for resetting test state
 * This is called during test environment setup to ensure a clean state
 */
export const mockCleanup = vi.fn(() => {
  // Reset all mocks
  vi.clearAllMocks();
  vi.clearAllTimers();

  // Clear any global state that might affect tests
  process.env = { ...process.env };

  // Add any additional cleanup logic here
});
