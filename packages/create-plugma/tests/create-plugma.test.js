import { jest } from '@jest/globals';
import inquirer from 'inquirer';
import { execSync } from 'child_process';

describe('create plugma', () => {
	beforeAll(() => {
		// Spy on inquirer.prompt and mock its implementation
		jest.spyOn(inquirer, 'prompt').mockImplementation(() => Promise.resolve({ framework: 'React' }));
	});

	afterAll(() => {
		// Restore the original prompt after all tests
		inquirer.prompt.mockRestore();
	});

	test('should run plugma dev without errors and select React', () => {
		// Set up process.argv as if we're running "plugma dev"
		process.argv = ['node', 'create-plugma', 'dev'];

		// Spy on console.log to capture CLI output for verification
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

		// Execute the command and capture output
		const output = execSync('node ../create-plugma/create-plugma.js', { encoding: 'utf-8' });


		// Assert that the initial prompt for framework selection appears
		expect(output).toContain('? Select a framework:');

		// Log the output to review if needed
		console.log(output);

		// Assert that the CLI acknowledged the "React" selection
		expect(output).toContain('You selected React'); // Adjust if there's specific wording in your CLI

		// Optionally, verify that console.log was called with specific text if "React" leads to more output
		expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('You selected React'));

		// Restore console log to original
		consoleSpy.mockRestore();
	});
});
