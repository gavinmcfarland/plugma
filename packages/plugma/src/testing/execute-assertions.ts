import { defaultLogger as logger } from '#utils/log/logger.js';
import { expect as vitestExpect } from 'vitest';

/**
 * Executes assertion code strings using Vitest's expect
 * @param assertions Array of assertion code strings
 *
 * @example
 * executeAssertions([
 *   'expect(5).toBeGreaterThan(3)',
 *   'expect("text").toHaveLength(4)'
 * ]);
 */
export function executeAssertions(assertions: string[]): void {
  logger.debug('Executing assertions', { count: assertions.length });

  for (const code of assertions) {
    try {
      const assertFn = new Function('expect', code);
      assertFn(vitestExpect);
      logger.debug('Assertion succeeded:', code);
    } catch (error) {
      logger.error('Assertion failed:', { code, error });
      throw error;
    }
  }
}
