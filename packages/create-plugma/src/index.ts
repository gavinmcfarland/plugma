/**
 * Create Plugma - Public API
 * Export functions and utilities for use in other packages
 */

// Main command functions
export { create } from './create.js';
export { add } from './add.js';

// Command parsing utilities
export { defineCreateCommand, parseCreateArgs, getCreateExamplesText } from './utils/parse-create-args.js';
export { defineAddCommand, parseAddArgs, getAddExamplesText } from './utils/parse-add-args.js';

// Type definitions
export { createOptions } from './utils/create-options.js';
export type { CreateCommandOptions, AddCommandOptions } from './utils/create-options.js';
export type { ParsedCreateArgs, CreateCommandConfig } from './utils/parse-create-args.js';
export type { ParsedAddArgs, AddCommandConfig } from './utils/parse-add-args.js';
