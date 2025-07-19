import type { Task } from '#tasks';
import { mockFs } from '../fs/mock-fs';
import { mockWebSocket } from '../server/mock-websocket';
import { mockVite } from '../vite/mock-vite';

/**
 * Mock task to show Plugma prompt
 */
export const ShowPlugmaPromptTask: Task = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  mockWebSocket.sendMessage({ type: 'prompt:show' });
};

/**
 * Mock task to build main
 */
export const BuildMainTask: Task = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  mockFs.writeFile('dist/main.js', 'console.log("Main built")');
};

/**
 * Mock task to build manifest
 */
export const BuildManifestTask: Task = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  mockFs.writeFile(
    'dist/manifest.json',
    JSON.stringify({
      name: 'Test Plugin',
      id: 'test-plugin',
      api: '1.0.0',
    }),
  );
};

/**
 * Mock task to start Vite server
 */
export const StartViteServerTask: Task = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  mockVite.start();
};

/**
 * Mock task to restart Vite server
 */
export const RestartViteServerTask: Task = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  mockVite.restart();
};

/**
 * Mock task to start WebSockets server
 */
export const StartWebSocketsServerTask: Task = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  mockWebSocket.emit('listening');
};
