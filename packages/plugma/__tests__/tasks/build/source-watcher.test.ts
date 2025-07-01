import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

// Hoist mocks
const mocks = vi.hoisted(() => {
  const pathMock = {
    dirname: vi.fn().mockImplementation((path: string) => {
      const parts = path.split('/')
      return parts.slice(0, -1).join('/') || '.'
    }),
    join: vi.fn().mockImplementation((...paths: string[]) => paths.join('/')),
    resolve: vi.fn().mockImplementation((p: string) => p),
    relative: vi.fn().mockImplementation((from, to) => to),
    sep: '/',
  }

  const watcher: any = {
    on: vi.fn().mockReturnValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    add: vi.fn(),
  }

  // Fix the circular reference
  watcher.on.mockReturnValue(watcher)

  const buildManifestFileMock = vi.fn().mockResolvedValue({
    files: {
      manifest: {
        main: 'src/main.ts',
        ui: 'src/ui.html',
      },
    },
    result: {
      raw: {
        main: 'src/main.ts',
        ui: 'src/ui.html',
      },
    },
  })

  const viteStateMock = {
    viteServer: null as any,
  }

  return {
    path: {
      ...pathMock,
      default: pathMock,
      relative: pathMock.relative,
    },
    chokidar: {
      watch: vi.fn().mockReturnValue(watcher),
    },
    watcher,
    buildManifestFileMock,
    viteStateMock,
    createBuildMainTask: vi.fn().mockReturnValue({
      run: vi.fn(),
    }),
    createStartViteServerTask: vi.fn().mockReturnValue({
      run: vi.fn(),
    }),
    Listr: vi.fn().mockImplementation((tasks) => ({
      run: vi.fn().mockResolvedValue({}),
    })),
    notifyInvalidManifestOptions: vi.fn(),
  }
})

// Mock modules
vi.mock('node:path', () => mocks.path)

vi.mock('chokidar', () => ({
  default: mocks.chokidar,
}))

vi.mock('../manifest/manifest-builder.js', () => ({
  buildManifestFile: mocks.buildManifestFileMock,
}))

vi.mock('../../utils/vite-state-manager.js', () => ({
  viteState: mocks.viteStateMock,
}))

vi.mock('../build-main.js', () => ({
  createBuildMainTask: mocks.createBuildMainTask,
}))

vi.mock('../start-dev-server.js', () => ({
  createStartViteServerTask: mocks.createStartViteServerTask,
}))

vi.mock('listr2', () => ({
  Listr: mocks.Listr,
  ListrLogLevels: {
    COMPLETED: 'COMPLETED',
    OUTPUT: 'OUTPUT',
    SKIPPED: 'SKIPPED',
    FAILED: 'FAILED',
  },
  ListrLogger: class {},
}))

vi.mock('../../utils/config/notify-invalid-manifest-options.js', () => ({
  notifyInvalidManifestOptions: mocks.notifyInvalidManifestOptions,
}))

import { setupSourceWatcher } from '../../../src/tasks/manifest/source-watcher.js'

const baseOptions = {
  command: 'dev' as const,
  mode: 'development',
  port: 3000,
  output: 'dist',
  instanceId: 'test',
  debug: false,
  cwd: '/test/project',
}

describe('SourceWatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.viteStateMock.viteServer = null
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Dynamic Path Detection', () => {
    test('should watch directories based on manifest paths', async () => {
      // Mock manifest with custom paths
      mocks.buildManifestFileMock.mockResolvedValue({
        files: {
          manifest: {
            main: 'code/main.ts',
            ui: 'ui/app.html',
          },
        },
        result: {
          raw: {
            main: 'code/main.ts',
            ui: 'ui/app.html',
          },
        },
      })

      const state = {
        previousMainValue: undefined,
        previousUiValue: undefined,
        existingFiles: new Set<string>(),
      }

      const watcher = setupSourceWatcher(baseOptions, state)

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0))

      // Verify that chokidar was called with the correct paths
      expect(mocks.chokidar.watch).toHaveBeenCalledWith([], {
        persistent: true,
        ignoreInitial: false,
      })

      // Verify that the watcher.add was called with the correct directories
      expect(mocks.watcher.add).toHaveBeenCalledWith('code')
      expect(mocks.watcher.add).toHaveBeenCalledWith('ui')

      await watcher.close()
    })

    test('should handle manifest with only main file', async () => {
      mocks.buildManifestFileMock.mockResolvedValue({
        files: {
          manifest: {
            main: 'src/main.ts',
            // No ui file
          },
        },
        result: {
          raw: {
            main: 'src/main.ts',
            // No ui file
          },
        },
      })

      const state = {
        previousMainValue: undefined,
        previousUiValue: undefined,
        existingFiles: new Set<string>(),
      }

      const watcher = setupSourceWatcher(baseOptions, state)

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0))

      // Should only watch the main directory
      expect(mocks.watcher.add).toHaveBeenCalledWith('src')
      expect(mocks.watcher.add).not.toHaveBeenCalledWith('ui')

      await watcher.close()
    })

    test('should handle manifest with only ui file', async () => {
      mocks.buildManifestFileMock.mockResolvedValue({
        files: {
          manifest: {
            // No main file
            ui: 'ui/app.html',
          },
        },
        result: {
          raw: {
            // No main file
            ui: 'ui/app.html',
          },
        },
      })

      const state = {
        previousMainValue: undefined,
        previousUiValue: undefined,
        existingFiles: new Set<string>(),
      }

      const watcher = setupSourceWatcher(baseOptions, state)

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0))

      // Should only watch the ui directory
      expect(mocks.watcher.add).toHaveBeenCalledWith('ui')
      expect(mocks.watcher.add).not.toHaveBeenCalledWith('src')

      await watcher.close()
    })
  })

  describe('Server Management', () => {
    test('should not start duplicate vite servers', async () => {
      // Mock that a server is already running
      mocks.viteStateMock.viteServer = { close: vi.fn() }

      const state = {
        previousMainValue: undefined,
        previousUiValue: undefined,
        existingFiles: new Set<string>(),
      }

      const watcher = setupSourceWatcher(baseOptions, state)

      // Simulate a file add event for the UI file
      const addHandler = mocks.watcher.on.mock.calls.find(
        (call: any) => call[0] === 'add'
      )?.[1]

      if (addHandler) {
        await addHandler('src/ui.html')
      }

      // Should not start a new server since one is already running
      expect(mocks.createStartViteServerTask).not.toHaveBeenCalled()

      await watcher.close()
    })

    test('should start vite server when none is running', async () => {
      // Mock that no server is running
      mocks.viteStateMock.viteServer = null

      const state = {
        previousMainValue: undefined,
        previousUiValue: undefined,
        existingFiles: new Set<string>(),
      }

      const watcher = setupSourceWatcher(baseOptions, state)

      // Simulate a file add event for the UI file
      const addHandler = mocks.watcher.on.mock.calls.find(
        (call: any) => call[0] === 'add'
      )?.[1]

      if (addHandler) {
        await addHandler('src/ui.html')
      }

      // Should start a new server since none is running
      expect(mocks.createStartViteServerTask).toHaveBeenCalledWith(baseOptions)

      await watcher.close()
    })
  })
})
