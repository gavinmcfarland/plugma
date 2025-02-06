import { dev } from '#commands/dev.js';
import { preview } from '#commands/preview.js';
import type {
  DevCommandOptions,
  PreviewCommandOptions,
} from '#commands/types.js';
import { vi } from 'vitest';

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
 * Waits for a specified duration
 *
 * @param ms - Duration to wait in milliseconds
 * @returns Promise that resolves after the duration
 *
 * @example
 * ```ts
 * // Wait for 1 second
 * await waitFor(1000);
 * ```
 */
export async function waitFor(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Result of executing a command while waiting for specific output
 */
export interface ExecuteUntilOutputResult {
  /** Whether the expected output was found within the timeout */
  matched: boolean;
  /** The captured console output */
  output: string;
  /** Time waited in milliseconds */
  elapsed: number;
}

/**
 * Strips ANSI color codes from a string
 */
function stripAnsi(str: string): string {
  return str.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    '',
  );
}

/**
 * Strips log level prefixes from a string
 */
function stripLogLevel(str: string): string {
  // First strip ANSI color codes
  const noColors = stripAnsi(str);
  // Then strip log level prefixes and any additional formatting
  return noColors
    .replace(/^(?:INFO|DEBUG|ERROR|WARNING|SUCCESS):\s+/i, '')
    .replace(/^\[.*?\]\s+/g, '') // Remove any [prefix] style tags
    .replace(/^(?:INFO|DEBUG|ERROR|WARNING|SUCCESS):\s+/i, ''); // Run again to catch any remaining prefixes
}

/**
 * Executes a command until specific console output is detected
 *
 * @param pattern - Regular expression to match against console output
 * @param fn - Function that returns a CommandProcess
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 * @returns Promise resolving to an object containing the match result and captured output
 *
 * @example
 * ```ts
 * const result = await executeUntilOutput(
 *   /Server started/,
 *   () => startDevCommand({ debug: true })
 * );
 *
 * if (result.matched) {
 *   expect(result.output).toContain('Server started successfully');
 * } else {
 *   console.log('Server did not start within timeout. Output:', result.output);
 * }
 * ```
 */
export async function executeUntilOutput(
  pattern: RegExp,
  fn: () => CommandProcess,
  timeout = 5000,
): Promise<ExecuteUntilOutputResult> {
  const consoleSpy = vi.spyOn(console, 'log');
  const process = fn();
  const startTime = Date.now();
  let capturedOutput = '';
  let matched = false;

  try {
    const result = await new Promise<ExecuteUntilOutputResult>((resolve) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        console.error(
          'DEBUG - Timeout reached. Final output:',
          capturedOutput.trim(),
        );
        resolve({
          matched,
          output: capturedOutput.trim(),
          elapsed: Date.now() - startTime,
        });
      }, timeout);

      // Set up console spy
      const checkOutput = (...args: unknown[]) => {
        const output = args.join(' ');
        capturedOutput += `${output}\n`;

        // Strip ANSI color codes and log level prefixes before testing the pattern
        const strippedOutput = stripAnsi(output)
          .replace(/^\[.*?\]\s+/g, '') // Remove [prefix] style tags
          .replace(/^(?:INFO|DEBUG|ERROR|WARNING|SUCCESS):\s+/i, '') // Remove log level prefixes
          .replace(/^(?:INFO|DEBUG|ERROR|WARNING|SUCCESS):\s+/i, ''); // Run again to catch any remaining prefixes

        console.error('DEBUG - Raw output:', output);
        console.error('DEBUG - Stripped output:', strippedOutput);
        console.error('DEBUG - Pattern:', pattern);
        console.error(
          'DEBUG - Pattern test result:',
          pattern.test(strippedOutput),
        );
        if (!matched && pattern.test(strippedOutput)) {
          matched = true;
          clearTimeout(timeoutId);
          resolve({
            matched: true,
            output: capturedOutput.trim(),
            elapsed: Date.now() - startTime,
          });
        }
      };

      consoleSpy.mockImplementation(checkOutput);
    });

    return result;
  } finally {
    consoleSpy.mockRestore();
    await process.terminate();
  }
}

/**
 * Executes a command for a specified duration and then terminates it
 *
 * @param duration - Duration in milliseconds to run the command
 * @param fn - Function that returns a CommandProcess
 * @returns Promise that resolves when the duration has elapsed and command is terminated
 *
 * @example
 * ```ts
 * await executeForDuration(3000, () => startDevCommand({
 *   debug: true,
 *   command: 'dev',
 *   cwd: sandboxDir,
 * }));
 * ```
 */
export async function executeForDuration(
  duration: number,
  fn: () => CommandProcess,
): Promise<void> {
  const process = fn();
  try {
    await waitFor(duration);
  } finally {
    await process.terminate();
  }
}

/**
 * Starts the dev command in the background
 *
 * @param options - Dev command options
 * @returns Command process handle
 */
export function startDevCommand(options: DevCommandOptions): CommandProcess {
  let cleanup: (() => Promise<void>) | undefined;
  let isTerminated = false;

  // Start the command
  const running = dev({
    ...options,
    cwd: options.cwd || process.cwd(),
    onCleanup: async (cleanupFn) => {
      cleanup = cleanupFn;
    },
  }).catch((error) => {
    if (!isTerminated) {
      console.error('Dev command failed:', error);
    }
  });

  return {
    options,
    terminate: async () => {
      isTerminated = true;
      if (cleanup) {
        await cleanup();
      }
      await running;
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
  let cleanup: (() => Promise<void>) | undefined;
  let isTerminated = false;

  // Start the command
  const running = preview({
    ...options,
    onCleanup: async (cleanupFn) => {
      cleanup = cleanupFn;
    },
  }).catch((error) => {
    if (!isTerminated) {
      console.error('Preview command failed:', error);
    }
  });

  return {
    options,
    terminate: async () => {
      isTerminated = true;
      if (cleanup) {
        await cleanup();
      }
      await running;
    },
  };
}
