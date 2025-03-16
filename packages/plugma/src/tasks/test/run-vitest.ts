/**
 * Utility to run Vitest programmatically
 */

import { startVitest } from "vitest/node";
import { task } from "../runner.js";

interface TestOptions {
	/** Test timeout in milliseconds */
	timeout?: number;
	/** Whether to run in watch mode */
	watch?: boolean;
	/** Path to test files */
	testFiles?: string[];
	/** Enable debug logging */
	debug?: boolean;
}

interface TestResult {
	/** Whether all tests passed */
	success: boolean;
	/** Number of failed tests */
	failedTests: number;
}

const runTestsRunner = async (
	options: TestOptions = {},
): Promise<TestResult> => {
	try {
		// Basic Vitest configuration
		const config = {
			test: {
				globals: true,
				environment: "node",
				testTimeout: options.timeout ?? 10000,
				watch: options.watch ?? false,
				include: options.testFiles ?? [
					"**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
				],
			},
		};

		// Start Vitest instance
		const vitest = await startVitest("test", [], {
			...config,
			api: true,
		});

		await vitest.start();

		// Get results
		const failedTests = vitest.state.getCountOfFailedTests();
		const success = failedTests === 0;

		if (options.debug) {
			console.log("Test run completed:", {
				success,
				failedTests,
			});
		}

		return {
			success,
			failedTests,
		};
	} catch (error) {
		console.error(
			"Failed to run tests:",
			error instanceof Error ? error.message : String(error),
		);
		throw error;
	}
};

export const RunTests = task("test", runTestsRunner);
