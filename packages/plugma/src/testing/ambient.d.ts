declare global {
  var currentTest: TestContext;
  export function test(
    name: string,
    fn: () => void | Promise<void>,
  ): void | Promise<void>;

  export const expect: import('vitest').ExpectStatic;
  function handleTestMessage(message: TestMessage): void;
}
