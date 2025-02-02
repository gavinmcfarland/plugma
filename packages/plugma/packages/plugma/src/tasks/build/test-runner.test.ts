import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanupTestEnv, setupTestEnv, waitForMessage } from '../../test-utils';
import { test } from './test-runner';

describe('test-runner.ts', () => {
  let ws: any;

  beforeEach(async () => {
    ws = await setupTestEnv();
  });

  afterEach(() => {
    cleanupTestEnv();
  });

  describe('test function', () => {
    it('properly wraps Vitest test function', () => {
      const testCases = {
        basic: {
          name: 'creates a rectangle',
          fn: () => {},
        },
      };

      const result = test(testCases.basic.name, testCases.basic.fn);

      expect(result).toEqual({
        name: testCases.basic.name,
        fn: expect.any(Function),
        browserOnly: false,
        concurrent: false,
        fails: false,
        only: false,
        sequential: true,
        skip: false,
        todo: false,
      });
    });

    it('handles async test functions', async () => {
      const asyncFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      };

      const result = test('async test', asyncFn);
      await result.fn();
    });

    it('manages test timeouts correctly', async () => {
      const slowFn = () => new Promise((resolve) => setTimeout(resolve, 31000));
      const result = test('slow test', slowFn);

      vi.useFakeTimers();
      const testPromise = result.fn();
      vi.advanceTimersByTime(31000);

      await expect(testPromise).rejects.toThrow(/timed out/);
      vi.useRealTimers();
    });
  });

  describe('error handling', () => {
    it('handles test timeouts properly', () => {
      const slowFn = () => new Promise((resolve) => setTimeout(resolve, 31000));
      expect(() => test('slow test', slowFn)).toThrow(/timed out/);
    });

    it('provides detailed error messages', async () => {
      const errorFn = () => {
        throw new Error('Custom test error');
      };

      const result = test('error test', errorFn);
      const testPromise = result.fn();

      await expect(testPromise).rejects.toThrow(/Custom test error/);
      const errorMessage = await waitForMessage(ws, 'TEST_ERROR');
      expect(errorMessage).toContain('Custom test error');
    });

    it('preserves stack traces', async () => {
      const errorFn = () => {
        throw new Error('Error with stack');
      };

      const result = test('stack test', errorFn);
      try {
        await result.fn();
      } catch (error) {
        expect(error.stack).toMatch(/Error with stack/);
        expect(error.stack).toMatch(/test-runner\.test\.ts/);
      }
    });

    it('includes plugin state in errors', async () => {
      const stateErrorFn = () => {
        throw new Error('Plugin state error');
      };

      const result = test('state test', stateErrorFn);
      const testPromise = result.fn();

      await expect(testPromise).rejects.toThrow(/Plugin state error/);
      const errorMessage = await waitForMessage(ws, 'TEST_ERROR');
      expect(errorMessage).toContain('Plugin state error');
    });
  });
});
