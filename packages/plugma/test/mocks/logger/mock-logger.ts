import { vi } from 'vitest';

/**
 * Creates a mock logger instance with all methods mocked using vitest
 * @returns A mock logger instance with debug, success, and error methods
 */
export const createMockLogger = () => ({
  debug: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
});

// Export a shared instance for use in tests
export const mockLogger = createMockLogger();

/**
 * Type guard to check if a value is a mock logger
 * @param value - Value to check
 * @returns True if value is a mock logger
 */
export const isMockLogger = (
  value: unknown,
): value is ReturnType<typeof createMockLogger> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'debug' in value &&
    'success' in value &&
    'error' in value
  );
};

// Export a shared mock Logger class
export const mockLoggerClass = vi.fn().mockImplementation(() => mockLogger);

// Mock the Logger class
vi.mock('#utils/log/logger.js', () => ({
  Logger: vi.fn().mockImplementation(() => mockLogger),
}));
