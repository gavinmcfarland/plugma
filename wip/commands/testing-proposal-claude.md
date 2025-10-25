# Testing Proposal: Hybrid Command Pattern Approach

## Overview

This proposal suggests a hybrid approach that combines the reliability of the expect-based solution with the developer experience of the proxy approach. The core idea is to treat Figma operations as commands that can be recorded, serialized, and executed, while keeping assertions local to the test environment.

## Key Concepts

1. **Command Pattern**
   - Each Figma operation is a command
   - Commands are serializable and replayable
   - Results are cached when possible

2. **Smart Batching**
   - Multiple commands are batched when safe
   - Automatic dependency detection
   - Parallel execution when possible

3. **Local State Mirror**
   - Lightweight local state tracking
   - Predictive updates for better DX
   - Lazy validation with Figma

## How It Works

1. **Command Recording**
   ~~~ts
   // User writes
   const rect = figma.createRectangle()
   rect.resize(100, 100)
   
   // Internally recorded as
   const cmd1 = new CreateNodeCommand('RECTANGLE')
   const cmd2 = new ResizeCommand(cmd1.result, 100, 100)
   ~~~

2. **Command Execution**
   ~~~ts
   // Commands are batched and executed
   const batch = new CommandBatch([cmd1, cmd2])
   const results = await batch.execute()
   
   // Results are cached locally
   const rect = results.get(cmd1)  // Local mirror of Figma object
   ~~~

3. **Smart State Tracking**
   ~~~ts
   // Local state is updated predictively
   rect.width = 200  // Updates local mirror immediately
   
   // Changes are batched and synced with Figma
   await flushChanges()  // Actual Figma update happens here
   ~~~

## Implementation Example

~~~ts
// Core command interface
interface Command<T> {
  readonly id: string
  readonly type: string
  readonly deps: Command<any>[]
  execute(context: ExecutionContext): Promise<T>
  toJSON(): string
}

// Example commands
class CreateRectangleCommand implements Command<RectangleNode> {
  readonly type = 'CREATE_RECTANGLE'
  readonly deps = []
  
  execute(ctx: ExecutionContext) {
    return ctx.execute(this)
  }
  
  toJSON() {
    return `figma.createRectangle()`
  }
}

class ResizeCommand implements Command<void> {
  constructor(
    readonly target: Command<SceneNode>,
    readonly width: number,
    readonly height: number
  ) {}
  
  readonly type = 'RESIZE'
  readonly deps = [this.target]
  
  execute(ctx: ExecutionContext) {
    return ctx.execute(this)
  }
  
  toJSON() {
    return `${this.target.id}.resize(${this.width}, ${this.height})`
  }
}

// Command execution
class CommandBatch {
  constructor(private commands: Command<any>[]) {}
  
  async execute(): Promise<Results> {
    const sorted = this.topologicalSort()
    const groups = this.groupIndependentCommands(sorted)
    
    const results = new Results()
    for (const group of groups) {
      await Promise.all(group.map(cmd => 
        this.executeCommand(cmd, results)
      ))
    }
    
    return results
  }
}

// Test example
test('creates a rectangle', async () => {
  // Commands are created automatically via proxy
  const rect = figma.createRectangle()
  rect.resize(100, 100)
  
  // Changes are batched and executed
  await flushChanges()
  
  // Assertions use local state when possible
  expect(rect.width).toBe(100)
  expect(rect.height).toBe(100)
  
  // Complex assertions force Figma sync
  expect(rect.parent.children).toContain(rect)
})
~~~

## Key Benefits

1. **Optimal Performance**
   - Commands are batched intelligently
   - Local state reduces round-trips
   - Parallel execution when possible

2. **Great Developer Experience**
   - Natural Figma API usage
   - Fast feedback from local state
   - Clear error messages

3. **Robust and Reliable**
   - Commands are replayable
   - Clear execution order
   - Easy to debug

4. **Easy to Extend**
   - New commands are simple to add
   - Custom command optimization
   - Framework agnostic

## How It Solves Previous Issues

1. **Statement Boundary Detection**
   - Commands have clear boundaries
   - Dependencies are explicit
   - No need for complex parsing

2. **Async Operations**
   - Commands are inherently async
   - Clear execution order
   - Easy to batch and optimize

3. **Object Identity**
   - Local mirrors maintain identity
   - References are command-based
   - Clear object lifecycle

4. **Performance**
   - Smart batching reduces round-trips
   - Local state for fast reads
   - Parallel execution

5. **State Management**
   - Predictive local updates
   - Lazy validation with Figma
   - Clear state ownership

6. **Error Handling**
   - Errors tied to commands
   - Clear stack traces
   - Easy to retry/rollback

## Implementation Details

1. **Command Creation**
   ~~~ts
   // Via proxy (for DX)
   const proxy = createCommandProxy()
   const rect = proxy.figma.createRectangle()
   
   // Or explicit (for complex cases)
   const cmd = new CreateRectangleCommand()
   const rect = await cmd.execute()
   ~~~

2. **State Mirroring**
   ~~~ts
   class LocalMirror<T> {
     private state: T
     private dirty = false
     
     update(patch: Partial<T>) {
       this.state = { ...this.state, ...patch }
       this.dirty = true
     }
     
     async validate() {
       if (this.dirty) {
         const real = await getFigmaState()
         this.state = real
         this.dirty = false
       }
     }
   }
   ~~~

3. **Smart Batching**
   ~~~ts
   class BatchOptimizer {
     groupCommands(cmds: Command[]): Command[][] {
       // Group independent commands
       // Respect dependencies
       // Maximize parallelism
     }
     
     canBatch(cmd1: Command, cmd2: Command): boolean {
       // Check if commands can be batched
       // Consider side effects
       // Respect ordering constraints
     }
   }
   ~~~

## Limitations

1. **Initial Setup Complexity**
   - Need to implement core command system
   - Command definitions required
   - Proxy setup for DX

2. **Memory Usage**
   - Local state mirrors consume memory
   - Need to manage mirror lifecycle
   - Garbage collection complexity

3. **Edge Cases**
   - Some operations hard to command-ify
   - Complex async patterns
   - UI event handling

## Future Improvements

1. **Command Optimization**
   - Command fusion
   - Better parallelization
   - Smarter batching

2. **State Management**
   - Partial state updates
   - Better cache invalidation
   - Selective mirroring

3. **Developer Experience**
   - Command recording/replay
   - Better debugging tools
   - Visual command flow

## Conclusion

The Command Pattern approach offers several advantages over both previous proposals:

1. **Better Performance**
   - Smarter operation batching
   - Reduced round-trips
   - Parallel execution

2. **More Reliable**
   - Clear execution model
   - Better error handling
   - Easier to debug

3. **Better DX**
   - Natural API usage
   - Fast feedback
   - Clear error messages

4. **More Maintainable**
   - Clear architecture
   - Easy to extend
   - Better testing

**Recommendation**: While this approach requires more initial setup, it provides the best balance of performance, reliability, and developer experience. The command pattern makes the system easier to understand, maintain, and extend, while solving the core challenges of testing Figma plugins. 
