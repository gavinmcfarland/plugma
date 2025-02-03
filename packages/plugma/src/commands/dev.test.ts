import {
  type PluginMessage,
  mockWebSocket,
} from '#test/mocks/server/mock-websocket.js';
import { mockTaskRunner } from '#test/mocks/tasks/mock-runner.js';
import { setupTestEnvironment } from '#test/utils/environment.js';
import { executeUntilOutput, startDevCommand } from '#test/utils/process.js';
import { nanoid } from 'nanoid';
import { fail } from 'node:assert';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getRandomPort } from '../utils/get-random-port.js';

// Mock dependencies
vi.mock('nanoid');
vi.mock('../utils/get-random-port.js');

// Get properly typed mocks
const mockedNanoid = vi.mocked(nanoid);
const mockedGetRandomPort = vi.mocked(getRandomPort);

function createOutputMismatchErrMsg(
  output: string,
  message: string,
): string | undefined {
  return `The output does not contain '''${message}'''\n\n --- output ---\n${output}\n---`;
}

describe('Dev Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedNanoid.mockReturnValue('test-instance-id');
    mockedGetRandomPort.mockReturnValue(12345);
  });

  describe('Task Execution', () => {
    test('should execute tasks with correct options and order', async () => {
      const message = 'Development server started successfully';
      const timeout = 3000;

      const result = await executeUntilOutput(
        new RegExp(message),
        () =>
          startDevCommand({
            debug: false,
            command: 'dev',
          }),
        timeout,
      );

      if (!result.matched) {
        fail(`Command did not complete within ${timeout}ms`);
      }

      // Verify task execution order
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

      // Verify task options
      const runTasks = mockTaskRunner.serial.mock.results[0].value;
      expect(runTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          debug: false,
          command: 'dev',
          mode: 'development',
          output: 'dist',
          instanceId: 'test-instance-id',
          port: 12345,
          cwd: process.cwd(),
        }),
      );

      // Verify mocked dependencies were called
      expect(mockedNanoid).toHaveBeenCalled();
      expect(mockedGetRandomPort).toHaveBeenCalled();
    }, 5000);

    test('should use provided options over defaults', async () => {
      const customOptions = {
        debug: true,
        command: 'dev' as const,
        mode: 'production' as const,
        output: 'custom-dist',
        port: 8080,
        cwd: '/custom/path',
      };

      const result = await executeUntilOutput(
        /Development server started successfully/,
        () => startDevCommand(customOptions),
        3000,
      );

      if (!result.matched) {
        fail('Command did not complete within timeout');
      }

      const runTasks = mockTaskRunner.serial.mock.results[0].value;
      expect(runTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          ...customOptions,
          instanceId: 'test-instance-id',
        }),
      );

      // These should not be called since values were provided
      expect(mockedGetRandomPort).not.toHaveBeenCalled();
    });

    test('should handle errors gracefully', async () => {
      const error = new Error('Task execution failed');
      const mockRunTasks = vi.fn().mockRejectedValue(error);
      mockTaskRunner.serial.mockReturnValue(mockRunTasks);

      const result = await executeUntilOutput(
        /Failed to start development server/,
        () =>
          startDevCommand({
            debug: false,
            command: 'dev',
          }),
        3000,
      );

      expect(result.matched).toBe(true);
      expect(result.output).toContain('Failed to start development server');
      expect(result.output).toContain('Task execution failed');
    });
  });

  describe('Integration', () => {
    let cleanup: () => Promise<void>;
    let messages: PluginMessage[];
    const sandboxDir = join(cwd(), 'test', 'sandbox');

    beforeEach(async () => {
      cleanup = await setupTestEnvironment({
        debug: true,
        testDir: sandboxDir,
        files: {
          'src/ui.html': '<div>Test UI</div>',
          'src/main.ts': 'console.log("Test main")',
          'package.json': '{"name": "test-plugin"}',
        },
      });
      messages = [];
      mockWebSocket.clearMessageHandlers();
      mockWebSocket.clearClients();
      mockWebSocket.onMessage((msg) => messages.push(msg));

      // Reset mocks for each test
      vi.clearAllMocks();
      mockedNanoid.mockReturnValue('test-instance-id');
      mockedGetRandomPort.mockReturnValue(12345);

      // Mock task runner to simulate successful task execution
      const mockRunTasks = vi.fn().mockResolvedValue(undefined);
      mockTaskRunner.serial.mockReturnValue(mockRunTasks);
    });

    afterEach(async () => {
      messages = [];
      mockWebSocket.clearMessageHandlers();
      mockWebSocket.clearClients();
      await cleanup?.();
    });

    test('should create all required build artifacts', async () => {
      // Wait for server start
      const result = await executeUntilOutput(
        /Development server started successfully/,
        () =>
          startDevCommand({
            debug: true,
            command: 'dev',
            cwd: sandboxDir,
          }),
        5000,
      );

      expect(
        result.matched,
        createOutputMismatchErrMsg(
          result.output,
          '✔︎ Development server started successfully',
        ),
      ).toBe(true);

      // Verify build artifacts
      expect(existsSync(join(sandboxDir, 'dist/ui.html'))).toBe(true);
      expect(existsSync(join(sandboxDir, 'dist/main.js'))).toBe(true);
      expect(existsSync(join(sandboxDir, 'dist/manifest.json'))).toBe(true);

      // Verify build content
      const uiContent = await readFile(
        join(sandboxDir, 'dist/ui.html'),
        'utf8',
      );
      expect(uiContent).toContain('Test UI');
    }, 7000);

    test('should log success message on server start', async () => {
      const process = startDevCommand({
        debug: true,
        command: 'dev',
        cwd: sandboxDir,
      });

      // Wait for initial output
      const startResult = await executeUntilOutput(
        /stdout \| [^\n]+[\r\n]+INFO: Starting development server\.\.\./,
        () => process,
        3000,
      );

      expect(startResult.matched).toBe(true);
      expect(startResult.output).toContain(
        'INFO: Starting development server...',
      );
      expect(startResult.output).toContain('INFO: Executing tasks...');

      // Wait for success message
      const successResult = await executeUntilOutput(
        /stdout \| [^\n]+[\r\n]+INFO: Development server started successfully\.\.\./,
        () => process,
        3000,
      );

      expect(successResult.matched).toBe(true);
      expect(successResult.output).toContain(
        'Development server started successfully',
      );
    }, 7000);

    describe('WebSocket Communication', () => {
      test('should establish WebSocket connection and send initial messages', async () => {
        // Start the process first
        const process = startDevCommand({
          debug: true,
          command: 'dev',
          cwd: sandboxDir,
        });

        // Wait for initial output
        const result = await executeUntilOutput(
          /stdout \| [^\n]+[\r\n]+INFO: Starting development server\.\.\./,
          () => process,
          3000,
        );

        expect(result.matched).toBe(true);
        expect(result.output).toContain('INFO: Starting development server...');
        expect(result.output).toContain('INFO: Executing tasks...');

        // Simulate server ready
        mockWebSocket.sendMessage(
          { type: 'server:ready', source: 'plugin', port: 12345 },
          'plugin',
        );

        // Wait for success message
        const successResult = await executeUntilOutput(
          /stdout \| [^\n]+[\r\n]+INFO: Development server started successfully\.\.\./,
          () => process,
          3000,
        );

        expect(successResult.matched).toBe(true);
        expect(messages).toContainEqual(
          expect.objectContaining({
            type: 'server:ready',
            source: 'plugin',
            port: 12345,
          }),
        );
      }, 7000);

      test('should handle client connections and disconnections', async () => {
        // Start the process first
        const process = startDevCommand({
          debug: true,
          command: 'dev',
          cwd: sandboxDir,
        });

        // Wait for initial output
        const result = await executeUntilOutput(
          /stdout \| [^\n]+[\r\n]+INFO: Starting development server\.\.\./,
          () => process,
          3000,
        );

        expect(result.matched).toBe(true);
        expect(result.output).toContain('INFO: Starting development server...');
        expect(result.output).toContain('INFO: Executing tasks...');

        // Simulate events
        mockWebSocket.sendMessage(
          { type: 'server:ready', source: 'plugin', port: 12345 },
          'plugin',
        );

        mockWebSocket.sendMessage(
          {
            type: 'client_connected',
            source: 'plugin',
            client: { id: 'test-client', source: 'ui' },
          },
          'plugin',
        );

        mockWebSocket.sendMessage(
          {
            type: 'client_disconnected',
            source: 'plugin',
            client: { id: 'test-client', source: 'ui' },
          },
          'plugin',
        );

        // Wait for success message
        const successResult = await executeUntilOutput(
          /stdout \| [^\n]+[\r\n]+INFO: Development server started successfully\.\.\./,
          () => process,
          3000,
        );

        expect(successResult.matched).toBe(true);

        const connectionEvents = messages.filter((msg) =>
          ['client_connected', 'client_disconnected'].includes(msg.type),
        );

        expect(connectionEvents).toEqual([
          expect.objectContaining({
            type: 'client_connected',
            source: 'plugin',
            client: expect.objectContaining({
              id: 'test-client',
              source: 'ui',
            }),
          }),
          expect.objectContaining({
            type: 'client_disconnected',
            source: 'plugin',
            client: expect.objectContaining({
              id: 'test-client',
              source: 'ui',
            }),
          }),
        ]);
      }, 7000);

      test('should handle build events', async () => {
        // Start the process first
        const process = startDevCommand({
          debug: true,
          command: 'dev',
          cwd: sandboxDir,
        });

        // Wait for initial output
        const result = await executeUntilOutput(
          /stdout \| [^\n]+[\r\n]+INFO: Starting development server\.\.\./,
          () => process,
          3000,
        );

        expect(result.matched).toBe(true);
        expect(result.output).toContain('INFO: Starting development server...');
        expect(result.output).toContain('INFO: Executing tasks...');

        // Simulate events
        mockWebSocket.sendMessage(
          { type: 'server:ready', source: 'plugin', port: 12345 },
          'plugin',
        );

        mockWebSocket.sendMessage(
          { type: 'build:start', source: 'plugin' },
          'plugin',
        );

        mockWebSocket.sendMessage(
          { type: 'build:complete', source: 'plugin' },
          'plugin',
        );

        // Wait for success message
        const successResult = await executeUntilOutput(
          /stdout \| [^\n]+[\r\n]+INFO: Development server started successfully\.\.\./,
          () => process,
          3000,
        );

        expect(successResult.matched).toBe(true);

        const buildMessages = messages.filter((msg) =>
          ['build:start', 'build:complete'].includes(msg.type),
        );

        expect(buildMessages).toEqual([
          expect.objectContaining({
            type: 'build:start',
            source: 'plugin',
          }),
          expect.objectContaining({
            type: 'build:complete',
            source: 'plugin',
          }),
        ]);
      }, 7000);

      test('should handle errors', async () => {
        // Start the process first
        const process = startDevCommand({
          debug: true,
          command: 'dev',
          cwd: sandboxDir,
        });

        // Wait for initial output
        const result = await executeUntilOutput(
          /stdout \| [^\n]+[\r\n]+INFO: Starting development server\.\.\./,
          () => process,
          3000,
        );

        expect(result.matched).toBe(true);
        expect(result.output).toContain('INFO: Starting development server...');
        expect(result.output).toContain('INFO: Executing tasks...');

        // Simulate events
        mockWebSocket.sendMessage(
          { type: 'server:ready', source: 'plugin', port: 12345 },
          'plugin',
        );

        mockWebSocket.sendMessage(
          {
            type: 'error',
            source: 'plugin',
            error: 'WebSocket error',
          },
          'plugin',
        );

        // Wait for success message
        const successResult = await executeUntilOutput(
          /stdout \| [^\n]+[\r\n]+INFO: Development server started successfully\.\.\./,
          () => process,
          3000,
        );

        expect(successResult.matched).toBe(true);
        expect(messages).toContainEqual(
          expect.objectContaining({
            type: 'error',
            source: 'plugin',
            error: 'WebSocket error',
          }),
        );
      }, 7000);
    });
  });
});
