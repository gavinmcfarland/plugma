# Testing Module ITD

> ITD: Important Technical Decision
> This document specifies the final decision made for how the testing module will be implemented.
> It includes:
> - Our goal (enable end-to-end testing of Figma plugins)
> - Why Plugma needs to create a testing module to make it possible
> - Overview of the testing process, from writing to running
> - The technical implementation details of how we made it work

## The Problem

Testing Figma plugins presents unique challenges:

1. Figma plugins run in a sandboxed environment where we cannot import external test frameworks
2. There's no way to remotely control Figma's UI or plugin sandbox
3. Mocking the entire Figma Plugin API is unrealistic and unsustainable due to:
   - The API's complexity and size
   - Frequent updates from Figma
   - The need to maintain perfect behavioral parity
   - Loss of true end-to-end testing benefits

## The Solution

Our solution bridges the gap between Node.js and Figma environments by:

1. Running test discovery and orchestration in Node using Vitest
2. Executing the actual tests inside Figma's plugin sandbox
3. Using WebSocket to coordinate between the two environments
4. Capturing and replaying assertions across environments

### Key Components

1. **Test Registry** (Figma Environment)
   - Stores test functions when plugin loads
   - Executes tests on demand
   - Captures assertions and results

2. **ExpectProxy** (Figma Environment)
   - Provides a Chai-like assertion API
   - Captures assertions as serializable code strings
   - Handles Figma object serialization

3. **TestRunner** (Node Environment)
   - Integrates with Vitest
   - Manages WebSocket communication
   - Executes captured assertions
   - Reports results

## Implementation Details

### Test Registration

~~~**typescript**
// In Figma environment
export const test = (name: string, fn: TestFunction) => {
  registry.register(name, fn);
};

// In Node environment
export const test = (name: string, fn: TestFunction) => {
  return vitestTest(name, async () => {
    const result = await testRunner.runTest(name);
    await executeAssertions(result.assertions);
  });
};
~~~

### Assertion Capture

~~~ts
class ExpectProxy {
  private assertions: string[] = [];

  expect<T>(actual: T) {
    return new Proxy({}, {
      get: (_, prop) => {
        const serialized = this.serialize(actual);
        return new Proxy(() => {}, {
          apply: (_, __, args) => {
            const serializedArgs = args.map(this.serialize);
            this.assertions.push(
              `expect(${serialized}).${String(prop)}(${serializedArgs.join(', ')})`
            );
          }
        });
      }
    });
  }

  private serialize(value: unknown): string {
    if (value instanceof FigmaNode) {
      return this.serializeFigmaNode(value);
    }
    return JSON.stringify(value);
  }
}
~~~

### Communication Protocol

~~~ts
type TestMessage =
  | { type: 'RUN_TEST'; testName: string; testRunId: string }
  | { type: 'TEST_ASSERTIONS'; testRunId: string; assertions: string[] }
  | { type: 'TEST_ERROR'; testRunId: string; error: string };
~~~

## Usage Example

~~~ts
import { test, expect } from 'plugma/testing';

test('creates a rectangle', async () => {
  const rect = figma.createRectangle();
  rect.resize(100, 100);
  
  expect(rect.type).to.equal('RECTANGLE');
  expect(rect.width).to.equal(100);
  expect(rect.height).to.equal(100);
});
~~~

## Alternative Solutions Considered

1. **Full API Mocking**
   - Pros:
     - No need for Figma runtime
     - Faster test execution
     - Simpler implementation
   - Cons:
     - Enormous maintenance burden
     - Not true end-to-end testing
     - Risk of behavioral differences
     - Need to update with every Figma release

2. **Custom Test Framework**
   - Pros:
     - Full control over implementation
     - Could be optimized for plugins
   - Cons:
     - Large bundle size
     - Significant development effort
     - Maintenance burden
     - Learning curve for users

Our chosen solution provides the best balance of:
- Reliable end-to-end testing
- Minimal maintenance burden
- Familiar developer experience
- Small bundle size
- Future compatibility

## Technical Limitations

1. **Test Isolation**
   - Tests run sequentially
   - Manual cleanup required
   - Shared plugin state

2. **Assertion Capabilities**
   - Limited to serializable values
   - Complex objects need special handling
   - Async assertions require careful design

3. **Performance**
   - Communication overhead
   - Sequential execution
   - Plugin reload between runs

## Future Improvements

1. **Test Isolation**
   - Automatic plugin state reset
   - Resource tracking and cleanup
   - Test context object

2. **Developer Experience**
   - Better error messages
   - Visual test results
   - IDE integration
   - Debugging tools

3. **Performance**
   - Message batching
   - Smarter scheduling
   - Parallel execution where possible

4. **Reliability**
   - Connection recovery
   - Error propagation
   - Timeout handling
   - Type safety improvements
