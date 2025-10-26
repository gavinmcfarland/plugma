# Testing Proposal: The Figma Proxy Approach

## Overview

This proposal suggests an alternative approach to testing Figma plugins by proxying the `figma` global object instead of using an expect-based assertion system. The core idea is to execute all Figma-related code in the actual Figma environment while making the process transparent to the test runner.

## How It Works

1. **Proxy Setup**
   - Replace the `figma` global with a proxy during test execution
   - Record all property accesses and function calls
   - Maintain reference mapping between local proxies and Figma objects

2. **Statement Detection**
   - Capture individual statements through proxy
   - Detect statement boundaries (function calls, property access)
   - Queue statements for execution

3. **Remote Execution**
   - Send statements to Figma via WebSocket
   - Execute in plugin environment
   - Return results or error status

4. **Value Proxying**
   - Create proxies for returned Figma objects
   - Maintain object identity across calls
   - Handle property access and method calls

## Implementation Example

~~~ts
// The proxy setup
const createFigmaProxy = () => {
  const objectMap = new Map<string, any>();
  let nextId = 1;

  return new Proxy({} as typeof figma, {
    get(target, prop) {
      // Record access to figma.prop
      return createValueProxy(`figma.${prop}`);
    }
  });
};

// Value proxy for Figma objects
const createValueProxy = (path: string) => {
  return new Proxy({}, {
    get(target, prop) {
      if (typeof prop === 'symbol') return target[prop];
      
      // Record access to value.prop
      return createValueProxy(`${path}.${prop}`);
    },
    
    apply(target, thisArg, args) {
      // Execute in Figma and return proxy to result
      return executeInFigma(`${path}(${serializeArgs(args)})`);
    }
  });
};

// Example test
test('creates a rectangle', async () => {
  const rect = figma.createRectangle();  // Sends: "figma.createRectangle()"
  rect.resize(100, 100);                 // Sends: "{objId:1}.resize(100,100)"
  
  const width = rect.width;              // Sends: "{objId:1}.width"
  expect(width).toBe(100);              // Local assertion, no WS needed
});
~~~

## Benefits

1. **Natural Testing Experience**
   - Write tests as if running directly in Figma
   - No special assertion API needed
   - Familiar testing patterns work

2. **True End-to-End Testing**
   - All Figma operations execute in real environment
   - No mocking or simulation required
   - Actual plugin behavior tested

3. **Maintainability**
   - No need to maintain assertion serialization
   - Figma API changes handled automatically
   - Simpler mental model

4. **Framework Agnostic**
   - Works with any test runner
   - No framework-specific integration needed
   - Easy to switch testing frameworks

## Critical Challenges

1. **Statement Boundary Detection**
   ```ts
   // How to know when this statement ends?
   figma.currentPage.selection[0].parent.children[2].resize(100, 100)
   ```

2. **Async Operation Handling**
   ```ts
   // How to handle promises and callbacks?
   const nodes = await figma.createNodes(data)
   figma.ui.onmessage = (msg) => { /* ... */ }
   ```

3. **Object Identity and References**
   ```ts
   // How to maintain consistent identity?
   const rect = figma.createRectangle()
   const parent = rect.parent
   expect(parent.children[0]).toBe(rect)  // Should be true
   ```

4. **Performance Impact**
   - Every property access requires WS round-trip
   - Complex operations need multiple messages
   - Significant latency overhead

5. **State Management**
   ```ts
   // How to handle state changes?
   const nodes = figma.currentPage.selection
   figma.currentPage.selection = []
   expect(nodes).toHaveLength(0)  // Original reference outdated
   ```

6. **Error Handling Complexity**
   ```ts
   // How to properly propagate errors?
   try {
     const node = figma.createNodeByType('INVALID')
   } catch (e) {
     expect(e).toBeInstanceOf(Error)  // Error from WS message
   }
   ```

## Implementation Challenges

1. **Proxy Limitations**
   - Cannot proxy primitive values
   - Some operations not interceptable
   - Special handling needed for certain APIs

2. **Race Conditions**
   - Concurrent operations may interfere
   - Need to synchronize state updates
   - Complex cleanup between tests

3. **Memory Management**
   - Need to track all proxied objects
   - Cleanup references after test
   - Handle circular references

4. **Debugging Difficulty**
   - Stack traces span environments
   - Hard to inspect proxy state
   - Complex error scenarios

## Potential Solutions

1. **Statement Detection**
   - Use AST transformation to mark boundaries
   - Leverage async/await for synchronization
   - Track execution context

2. **Object References**
   ~~~ts
   class RemoteRef {
     constructor(private id: string) {}
     
     async get<T>(): Promise<T> {
       return getFromFigma(this.id);
     }
     
     proxy(): any {
       return createProxy(this);
     }
   }
   ~~~

3. **State Synchronization**
   ~~~ts
   class StateManager {
     private states = new Map<string, any>();
     
     async sync(objId: string): Promise<void> {
       this.states.set(objId, await getFigmaState(objId));
     }
     
     invalidate(objId: string): void {
       this.states.delete(objId);
     }
   }
   ~~~

## Conclusion

While the Figma Proxy approach offers an elegant testing experience, its technical challenges make it significantly more complex than the expect-based solution:

1. **Complexity vs Benefit**
   - Implementation complexity is very high
   - Benefits mainly in DX, not functionality
   - Many edge cases to handle

2. **Reliability Concerns**
   - More points of failure
   - Higher performance impact
   - Harder to debug issues

3. **Maintenance Burden**
   - Complex proxy logic to maintain
   - More runtime overhead
   - Harder to extend functionality

**Recommendation**: While innovative, this approach introduces too much complexity and too many edge cases to be practical. The expect-based solution provides a better balance of functionality, reliability, and maintainability. 
