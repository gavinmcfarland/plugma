import { afterEach, beforeEach, describe, vi } from 'vitest';

describe('BuildUiTask', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ... existing code ...
});
