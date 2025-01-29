# Test Directory Structure

This directory contains test-related files for the Plugma project. The structure follows common testing best practices and is organized as follows:

## Directory Structure

```
/test
  /mocks           # Mock implementations for various modules
    /fs            # Filesystem mocks
    /vite          # Vite and Vite config mocks
    /tasks         # Task-related mocks
    /server        # Server and WebSocket mocks
  /helpers         # Test helper functions and utilities
```

## Conventions

1. **Unit Tests**: Unit tests are co-located with their source files. For example, `src/tasks/common/get-files.test.ts` is placed next to `src/tasks/common/get-files.ts`.

2. **Mocks**:
   - Mocks are organized by domain/functionality
   - Each mock file should focus on a single responsibility
   - Mock files are named with a `mock-` prefix

3. **Helpers**:
   - Helper functions that are used across multiple tests
   - Common test setup and teardown utilities
   - Test data generators and utilities

## Usage

### Importing Mocks

```typescript
// Import filesystem mocks
import { createMockFs } from '#test/mocks/fs/mock-fs.js';

// Import task mocks
import { createMockTaskContext } from '#test/mocks/tasks/mock-task.js';
```

### Using Helpers

```typescript
import { setupTestEnvironment } from '#test/helpers/setup.js';
```

## Best Practices

1. Keep mocks simple and focused
2. Use descriptive names for mock files and functions
3. Document complex mock behavior
4. Keep test files close to their source files
5. Use the helper functions to reduce code duplication
