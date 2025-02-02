import { vi } from 'vitest';
import WebSocket from 'ws';

export async function setupTestEnv() {
  // Mock WebSocket
  const ws = {
    readyState: WebSocket.OPEN,
    on: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
  };

  // Setup fake timers
  vi.useFakeTimers();

  // Run timers to establish connection
  await vi.runAllTimersAsync();

  return ws;
}

export async function waitForMessage(ws: WebSocket, type: string) {
  return new Promise((resolve) => {
    const handler = (message: string) => {
      const data = JSON.parse(message);
      if (data.type === type) {
        ws.off('message', handler);
        resolve(data);
      }
    };

    ws.on('message', handler);
  });
}

export function cleanupTestEnv() {
  vi.useRealTimers();
  vi.clearAllMocks();
}
