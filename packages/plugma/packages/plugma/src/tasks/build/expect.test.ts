import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanupTestEnv, setupTestEnv } from '../../test-utils';

describe('assertion.ts', () => {
  let ws: any;
  let globalThis: any;

  beforeEach(async () => {
    ws = await setupTestEnv();
    globalThis = {
      currentTest: {
        assertions: [],
      },
    };
  });

  afterEach(() => {
    cleanupTestEnv();
    delete globalThis.currentTest;
  });

  describe('expect proxy', () => {
    function verifyAssertion(assertion: any, expectedCode: string) {
      expect(assertion).toBeDefined();
      expect(assertion.code).toBe(expectedCode);
    }

    it('generates code string for simple equality', () => {
      const rect = { type: 'RECTANGLE' };
      expect(rect.type).toBe('RECTANGLE');

      verifyAssertion(
        globalThis.currentTest.assertions[0],
        'expect("RECTANGLE").to.equal("RECTANGLE")',
      );
    });

    it('handles method chaining', () => {
      const arr = [1, 2, 3];
      expect(arr).toBeInstanceOf(Array);
      expect(arr).toContain(2);

      verifyAssertion(
        globalThis.currentTest.assertions[0],
        'expect([1,2,3]).to.be.an("array").that.includes(2)',
      );
    });

    it('serializes different value types', () => {
      const obj = { a: 1, b: 'test', c: true, d: null };
      expect(obj).toEqual(obj);

      verifyAssertion(
        globalThis.currentTest.assertions[0],
        'expect({"a":1,"b":"test","c":true,"d":null}).to.deep.equal({"a":1,"b":"test","c":true,"d":null})',
      );
    });

    it('collects assertions in test context', () => {
      const rect = { type: 'RECTANGLE', children: [] };
      expect(rect.type).toBe('RECTANGLE');
      expect(rect.type).toMatch(/RECT/);
      expect(rect.children).toBeInstanceOf(Array);

      expect(globalThis.currentTest.assertions).toHaveLength(3);
    });
  });

  describe('assertion execution', () => {
    it('maintains assertion order', () => {
      const rect = { type: 'RECTANGLE', id: 'rect1' };
      expect(rect.type).toBe('RECTANGLE');
      expect(rect.id).toBeTypeOf('string');

      const [first, second] = globalThis.currentTest.assertions;

      verifyAssertion(first, 'expect("RECTANGLE").to.equal("RECTANGLE")');
      verifyAssertion(second, 'expect("rect1").to.be.a("string")');
    });
  });
});
