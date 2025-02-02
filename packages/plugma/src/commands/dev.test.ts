import {
  type MockWebSocketClient,
  type PluginMessage,
  mockWebSocket,
} from '#test/mocks/server/mock-websocket.js';
import { mockTaskRunner } from '#test/mocks/tasks/mock-runner.js';
import {
  setupTestEnvironment,
  triggerFileChange,
  waitForCondition,
} from '#test/utils/environment.js';
import {
  startDevCommand,
  waitForBuild,
  waitForServers,
} from '#test/utils/process.js';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { dev } from './dev.js';
import type { DevCommandOptions } from './types.js';

describe('Dev Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Task Execution', () => {
    test('should execute tasks in correct order', async () => {
      const options: DevCommandOptions = { debug: false, command: 'dev' };
      await dev(options);

      expect(mockTaskRunner.serial).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'common:get-files' }),
        expect.objectContaining({ name: 'common:show-plugma-prompt' }),
        expect.objectContaining({ name: 'build:ui' }),
        expect.objectContaining({ name: 'build:main' }),
        expect.objectContaining({ name: 'build:manifest' }),
        expect.objectContaining({ name: 'server:start-vite' }),
        expect.objectContaining({ name: 'server:restart-vite' }),
        expect.objectContaining({ name: 'server:websocket' }),
      );

      // Verify the options passed to the returned function
      const runTasks = mockTaskRunner.serial.mock.results[0].value;
      expect(runTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          ...options,
          mode: 'development',
          output: 'dist',
          instanceId: expect.any(String),
          port: expect.any(Number),
        }),
      );
    });

    test('should handle errors gracefully', async () => {
      const error = new Error('Task execution failed');
      const mockRunTasks = vi.fn().mockRejectedValue(error);
      mockTaskRunner.serial.mockReturnValue(mockRunTasks);

      const options: DevCommandOptions = { debug: false, command: 'dev' };
      await expect(dev(options)).rejects.toThrow(error);
    });
  });

  describe('Integration', () => {
    let cleanup: () => Promise<void>;
    let messages: PluginMessage[];

    beforeEach(async () => {
      cleanup = await setupTestEnvironment({
        files: {
          'package.json': JSON.stringify({
            name: 'test-plugin',
            version: '1.0.0',
            main: 'src/main.ts',
            ui: 'src/ui.tsx',
          }),
          'src/ui.tsx': 'console.log("test ui")',
          'src/main.ts': 'console.log("test main")',
          'manifest.json': JSON.stringify({
            name: 'Test Plugin',
            id: 'test-plugin',
            api: '1.0.0',
            main: 'dist/main.js',
            ui: 'dist/ui.html',
          }),
        },
        debug: true,
      });
      messages = [];
      mockWebSocket.clearMessageHandlers();
      mockWebSocket.onMessage((msg) => messages.push(msg));
    });

    afterEach(async () => {
      await cleanup?.();
    });

    test.skip('should start servers and handle file changes', async () => {
      const devProcess = startDevCommand({ debug: true, command: 'dev' });

      try {
        // Wait for initial setup
        await waitForServers();
        await waitForBuild();

        // Verify initial build
        expect(existsSync(join(process.cwd(), 'dist/ui.html'))).toBe(true);
        expect(existsSync(join(process.cwd(), 'dist/main.js'))).toBe(true);

        // Test file changes
        await triggerFileChange('src/ui.tsx', 'console.log("modified ui")');
        await waitForBuild();

        // Verify rebuild occurred
        const uiContent = await readFile(
          join(process.cwd(), 'dist/ui.html'),
          'utf8',
        );
        expect(uiContent).toContain('modified ui');
      } finally {
        await devProcess.terminate();
      }
    }, 10000); // 10 second timeout

    test.skip('should handle WebSocket communication', async () => {
      const devProcess = startDevCommand({ debug: true, command: 'dev' });

      try {
        // Wait for servers
        await waitForServers();

        // Trigger a build
        await triggerFileChange('src/main.ts', 'console.log("new build")');
        await waitForBuild();

        // Verify build message was sent
        await waitForCondition(() =>
          messages.some((msg) => msg.type === 'build:complete'),
        );
        expect(messages).toContainEqual(
          expect.objectContaining({
            type: 'build:complete',
            source: 'plugin',
          }),
        );
      } finally {
        await devProcess.terminate();
      }
    }, 10000); // 10 second timeout

    describe('Toolbar Integration', () => {
      describe('Initialization', () => {
        test.skip('should initialize toolbar on UI connection', async () => {
          const devProcess = startDevCommand({ debug: true, command: 'dev' });
          let uiClient: MockWebSocketClient | undefined;

          try {
            await waitForServers();

            // Simulate UI connection
            uiClient = mockWebSocket.connectClient('test-ui', 'ui');

            // Verify toolbar initialization message
            await waitForCondition(() =>
              messages.some((msg) => msg.type === 'toolbar:init'),
            );
            expect(messages).toContainEqual(
              expect.objectContaining({
                type: 'toolbar:init',
                source: 'plugin',
                settings: expect.objectContaining({
                  shortcuts: expect.any(Object),
                  position: expect.any(String),
                  visible: expect.any(Boolean),
                }),
              }),
            );
          } finally {
            uiClient?.close();
            await devProcess.terminate();
          }
        }, 10000); // 10 second timeout

        test.skip('should restore toolbar state on reconnection', async () => {
          const devProcess = startDevCommand({ debug: true, command: 'dev' });
          let uiClient: MockWebSocketClient | undefined;

          try {
            await waitForServers();

            // Initial connection
            uiClient = mockWebSocket.connectClient('test-ui', 'ui');

            // Change toolbar state
            mockWebSocket.sendMessage(
              { type: 'toolbar:toggle', visible: false },
              'toolbar',
            );

            // Wait for state update
            await waitForCondition(() =>
              messages.some(
                (msg) =>
                  msg.type === 'visibility:update' && msg.visible === false,
              ),
            );

            // Simulate disconnect and reconnect
            uiClient.close();
            messages = []; // Clear messages
            uiClient = mockWebSocket.connectClient('test-ui-2', 'ui');

            // Verify state restored
            await waitForCondition(() =>
              messages.some((msg) => msg.type === 'toolbar:init'),
            );
            expect(messages).toContainEqual(
              expect.objectContaining({
                type: 'toolbar:init',
                source: 'plugin',
                settings: expect.objectContaining({
                  visible: false,
                }),
              }),
            );
          } finally {
            uiClient?.close();
            await devProcess.terminate();
          }
        }, 10000); // 10 second timeout
      });

      describe('Connection Handling', () => {
        test.skip('should handle multiple client connections', async () => {
          const devProcess = startDevCommand({ debug: true, command: 'dev' });
          const clients: MockWebSocketClient[] = [];

          try {
            await waitForServers();

            // Connect multiple clients
            clients.push(mockWebSocket.connectClient('test-ui', 'ui'));
            clients.push(
              mockWebSocket.connectClient('test-toolbar', 'toolbar'),
            );
            clients.push(mockWebSocket.connectClient('test-plugin', 'plugin'));

            // Verify client list updates
            await waitForCondition(() =>
              messages.some(
                (msg) =>
                  msg.type === 'client_list' &&
                  Array.isArray(msg.clients) &&
                  msg.clients.length === 3,
              ),
            );

            const clientListMsg = messages.find(
              (msg) => msg.type === 'client_list',
            );
            expect(clientListMsg?.clients).toHaveLength(3);
            expect(clientListMsg?.clients).toEqual(
              expect.arrayContaining([
                expect.objectContaining({ source: 'ui' }),
                expect.objectContaining({ source: 'toolbar' }),
                expect.objectContaining({ source: 'plugin' }),
              ]),
            );
          } finally {
            for (const client of clients) {
              client.close();
            }
            await devProcess.terminate();
          }
        }, 10000); // 10 second timeout

        test.skip('should handle client disconnection', async () => {
          const devProcess = startDevCommand({ debug: true, command: 'dev' });
          let uiClient: MockWebSocketClient | undefined;

          try {
            await waitForServers();

            // Connect and then disconnect UI
            uiClient = mockWebSocket.connectClient('test-ui', 'ui');
            await waitForCondition(() =>
              messages.some((msg) => msg.type === 'client_list'),
            );

            messages = []; // Clear messages
            uiClient.close();

            // Verify disconnect message
            await waitForCondition(() =>
              messages.some((msg) => msg.type === 'client_disconnected'),
            );
            expect(messages).toContainEqual(
              expect.objectContaining({
                type: 'client_disconnected',
                source: 'ui',
                client: expect.objectContaining({
                  id: 'test-ui',
                  source: 'ui',
                }),
              }),
            );
          } finally {
            uiClient?.close();
            await devProcess.terminate();
          }
        }, 10000); // 10 second timeout

        test.skip('should handle connection errors', async () => {
          const devProcess = startDevCommand({ debug: true, command: 'dev' });

          try {
            await waitForServers();

            // Simulate invalid message
            mockWebSocket.sendInvalidMessage();

            // Verify error handling
            await waitForCondition(() =>
              messages.some((msg) => msg.type === 'error'),
            );
            expect(messages).toContainEqual(
              expect.objectContaining({
                type: 'error',
                source: 'plugin',
                error: expect.any(String),
              }),
            );
          } finally {
            await devProcess.terminate();
          }
        }, 10000); // 10 second timeout
      });

      test.skip('should handle reload action', async () => {
        const devProcess = startDevCommand({ debug: true, command: 'dev' });

        try {
          await waitForServers();

          // Simulate toolbar reload action
          mockWebSocket.sendMessage({ type: 'toolbar:reload' }, 'toolbar');

          // Verify reload sequence
          await waitForCondition(() =>
            messages.some((msg) => msg.type === 'reload:start'),
          );
          expect(messages).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                type: 'reload:start',
                source: 'plugin',
              }),
              expect.objectContaining({
                type: 'reload:complete',
                source: 'plugin',
              }),
            ]),
          );
        } finally {
          await devProcess.terminate();
        }
      }, 10000); // 10 second timeout

      test.skip('should handle toggle visibility action', async () => {
        const devProcess = startDevCommand({ debug: true, command: 'dev' });

        try {
          await waitForServers();

          // Simulate toolbar visibility toggle
          mockWebSocket.sendMessage({ type: 'toolbar:toggle' }, 'toolbar');

          // Verify visibility update
          await waitForCondition(() =>
            messages.some((msg) => msg.type === 'visibility:update'),
          );
          expect(messages).toContainEqual(
            expect.objectContaining({
              type: 'visibility:update',
              source: 'plugin',
              visible: expect.any(Boolean),
            }),
          );
        } finally {
          await devProcess.terminate();
        }
      }, 10000); // 10 second timeout

      test.skip('should handle keyboard shortcuts', async () => {
        const devProcess = startDevCommand({ debug: true, command: 'dev' });

        try {
          await waitForServers();

          // Simulate keyboard shortcut
          mockWebSocket.sendMessage(
            {
              type: 'toolbar:shortcut',
              shortcut: 'reload',
              key: 'r',
              modifiers: ['ctrl', 'shift'],
            },
            'toolbar',
          );

          // Verify shortcut handling
          await waitForCondition(() =>
            messages.some((msg) => msg.type === 'reload:start'),
          );
          expect(messages).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                type: 'reload:start',
                source: 'plugin',
              }),
              expect.objectContaining({
                type: 'reload:complete',
                source: 'plugin',
              }),
            ]),
          );
        } finally {
          await devProcess.terminate();
        }
      }, 10000); // 10 second timeout
    });
  });
});
