import { registry } from "plugma/testing/figma";

/**
 * Register all test files by importing them
 * This ensures tests are available in Figma when the plugin loads
 */
//@index('./*.test.ts', f => `import "${f.path}";`)
import "./rectangle-color.test";
//@endindex

// Log registered tests for debugging
console.log("[TEST] Registered tests:", registry.getTestNames());
