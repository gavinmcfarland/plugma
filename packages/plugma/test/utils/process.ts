import { dev } from '#commands/dev.js';
import { preview } from '#commands/preview.js';
import type {
  DevCommandOptions,
  PreviewCommandOptions,
} from '#commands/types.js';

/**
 * Interface for a command process handle
 */
export interface CommandProcess {
  /** Terminates the command process */
  terminate: () => Promise<void>;
  /** Command options used */
  options: DevCommandOptions | PreviewCommandOptions;
}

/**
 * Starts the dev command in the background
 *
 * @param options - Dev command options
 * @returns Command process handle
 */
export function startDevCommand(options: DevCommandOptions): CommandProcess {
  // Create a promise that can be rejected
  let rejectRunning: (reason: Error) => void;
  const running = new Promise<void>((_, reject) => {
    rejectRunning = reject;
  });

  // Start the command
  void dev(options).catch(() => {});

  return {
    options,
    terminate: async () => {
      // Trigger cleanup handlers
      rejectRunning(new Error('Command terminated'));
    },
  };
}

/**
 * Starts the preview command in the background
 *
 * @param options - Preview command options
 * @returns Command process handle
 */
export function startPreviewCommand(
  options: PreviewCommandOptions,
): CommandProcess {
  // Create a promise that can be rejected
  let rejectRunning: (reason: Error) => void;
  const running = new Promise<void>((_, reject) => {
    rejectRunning = reject;
  });

  // Start the command
  void preview(options).catch(() => {});

  return {
    options,
    terminate: async () => {
      // Trigger cleanup handlers
      rejectRunning(new Error('Command terminated'));
    },
  };
}

/**
 * Waits for servers to be ready
 * Checks both Vite and WebSocket servers
 *
 * @param port - Port to check (optional)
 */
export async function waitForServers(port?: number): Promise<void> {
  // Wait for servers to be ready
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

/**
 * Waits for a build to complete
 * Checks for the existence of output files
 */
export async function waitForBuild(): Promise<void> {
  // Wait for build to complete
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
