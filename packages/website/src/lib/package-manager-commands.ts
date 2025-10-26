/**
 * Package manager command utilities
 * Local copy of functions from @plugma/shared to avoid build issues
 */

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun' | 'deno';

/**
 * Get a command for a specific package manager and command type
 */
export function getCommand(packageManager: PackageManager, commandType: string): string {
	switch (commandType) {
		case 'install':
			switch (packageManager) {
				case 'npm':
					return 'npm install';
				case 'yarn':
					return 'yarn';
				case 'pnpm':
					return 'pnpm install';
				case 'bun':
					return 'bun install';
				case 'deno':
					return 'deno install';
				default:
					return 'npm install';
			}

		case 'dev':
			switch (packageManager) {
				case 'npm':
					return 'npm run dev';
				case 'yarn':
					return 'yarn dev';
				case 'pnpm':
					return 'pnpm dev';
				case 'bun':
					return 'bun run dev';
				case 'deno':
					return 'deno run --allow-all dev';
				default:
					return 'npm run dev';
			}

		case 'build':
			switch (packageManager) {
				case 'npm':
					return 'npm run build';
				case 'yarn':
					return 'yarn build';
				case 'pnpm':
					return 'pnpm build';
				case 'bun':
					return 'bun run build';
				case 'deno':
					return 'deno run --allow-all build';
				default:
					return 'npm run build';
			}

		case 'test':
			switch (packageManager) {
				case 'npm':
					return 'npm test';
				case 'yarn':
					return 'yarn test';
				case 'pnpm':
					return 'pnpm test';
				case 'bun':
					return 'bun test';
				case 'deno':
					return 'deno test';
				default:
					return 'npm test';
			}

		case 'lint':
			switch (packageManager) {
				case 'npm':
					return 'npm run lint';
				case 'yarn':
					return 'yarn lint';
				case 'pnpm':
					return 'pnpm lint';
				case 'bun':
					return 'bun run lint';
				case 'deno':
					return 'deno lint';
				default:
					return 'npm run lint';
			}

		case 'start':
			switch (packageManager) {
				case 'npm':
					return 'npm start';
				case 'yarn':
					return 'yarn start';
				case 'pnpm':
					return 'pnpm start';
				case 'bun':
					return 'bun start';
				case 'deno':
					return 'deno run --allow-all start';
				default:
					return 'npm start';
			}

		case 'add':
			switch (packageManager) {
				case 'npm':
					return 'npm install';
				case 'yarn':
					return 'yarn add';
				case 'pnpm':
					return 'pnpm add';
				case 'bun':
					return 'bun add';
				case 'deno':
					return 'deno add';
				default:
					return 'npm install';
			}

		case 'remove':
			switch (packageManager) {
				case 'npm':
					return 'npm uninstall';
				case 'yarn':
					return 'yarn remove';
				case 'pnpm':
					return 'pnpm remove';
				case 'bun':
					return 'bun remove';
				case 'deno':
					return 'deno remove';
				default:
					return 'npm uninstall';
			}

		default:
			// Fallback for unknown command types
			switch (packageManager) {
				case 'npm':
					return `npm run ${commandType}`;
				case 'yarn':
					return `yarn ${commandType}`;
				case 'pnpm':
					return `pnpm ${commandType}`;
				case 'bun':
					return `bun run ${commandType}`;
				case 'deno':
					return `deno run --allow-all ${commandType}`;
				default:
					return `npm run ${commandType}`;
			}
	}
}

/**
 * Transform npm commands to other package managers
 * Useful for converting existing npm commands to other package managers
 * Handles npm's requirement for double dash (--) when passing options
 */
export function transformCommand(command: string, packageManager: PackageManager): string {
	if (packageManager === 'npm') {
		return command;
	}

	let transformed = command;

	// Handle create commands with options
	if (command.includes('npm create')) {
		// Use a more specific approach to handle multiple occurrences
		// First, find all npm create commands and replace them one by one
		const createRegex = /npm create\s+([^\s]+(?:\s+[^\s]+)*?)(?:\s+--\s+(.+?))?(?=\n|$)/g;
		let match;

		while ((match = createRegex.exec(command)) !== null) {
			const packageName = match[1].trim();
			const options = match[2]; // This will be undefined if no -- is present

			switch (packageManager) {
				case 'yarn':
					if (packageName === 'plugma@latest') {
						if (options) {
							transformed = transformed.replace(
								match[0],
								`yarn create plugma ${options}`
							);
						} else {
							transformed = transformed.replace(match[0], 'yarn create plugma');
						}
					} else {
						if (options) {
							transformed = transformed.replace(
								match[0],
								`yarn create ${packageName} ${options}`
							);
						} else {
							transformed = transformed.replace(
								match[0],
								`yarn create ${packageName}`
							);
						}
					}
					break;
				case 'pnpm':
					if (options) {
						transformed = transformed.replace(
							match[0],
							`pnpm create ${packageName} ${options}`
						);
					} else {
						transformed = transformed.replace(match[0], `pnpm create ${packageName}`);
					}
					break;
				case 'bun':
					if (options) {
						transformed = transformed.replace(
							match[0],
							`bun create ${packageName} ${options}`
						);
					} else {
						transformed = transformed.replace(match[0], `bun create ${packageName}`);
					}
					break;
				case 'deno':
					if (options) {
						transformed = transformed.replace(
							match[0],
							`deno create ${packageName} ${options}`
						);
					} else {
						transformed = transformed.replace(match[0], `deno create ${packageName}`);
					}
					break;
			}
		}
	}

	// Handle add commands (npm install package-name) - check this first
	const installMatch = command.match(/npm install\s+([^\s]+)/);
	if (installMatch && installMatch[1]) {
		transformed = transformed.replace(/npm install/g, getCommand(packageManager, 'add'));
	} else if (command.includes('npm install')) {
		// Handle install commands (only if no package name is specified)
		transformed = transformed.replace(/npm install/g, getCommand(packageManager, 'install'));
	}

	// Handle run commands with special logic for options
	if (command.includes('npm run')) {
		// Use a more specific approach to handle multiple occurrences
		const runRegex = /npm run\s+([^\s]+(?:\s+[^\s]+)*?)(?:\s+--\s+(.+?))?(?=\n|$)/g;
		let match;

		while ((match = runRegex.exec(command)) !== null) {
			const scriptName = match[1].trim();
			const options = match[2]; // This will be undefined if no -- is present

			switch (packageManager) {
				case 'yarn':
					if (options) {
						transformed = transformed.replace(
							match[0],
							`yarn ${scriptName} ${options}`
						);
					} else {
						transformed = transformed.replace(match[0], `yarn ${scriptName}`);
					}
					break;
				case 'pnpm':
					if (options) {
						transformed = transformed.replace(
							match[0],
							`pnpm ${scriptName} ${options}`
						);
					} else {
						transformed = transformed.replace(match[0], `pnpm ${scriptName}`);
					}
					break;
				case 'bun':
					if (options) {
						transformed = transformed.replace(
							match[0],
							`bun run ${scriptName} ${options}`
						);
					} else {
						transformed = transformed.replace(match[0], `bun run ${scriptName}`);
					}
					break;
				case 'deno':
					if (options) {
						transformed = transformed.replace(
							match[0],
							`deno run --allow-all ${scriptName} ${options}`
						);
					} else {
						transformed = transformed.replace(
							match[0],
							`deno run --allow-all ${scriptName}`
						);
					}
					break;
				default:
					transformed = transformed.replace(match[0], `npm run ${scriptName}`);
			}
		}
	}

	// Handle remove commands
	if (command.includes('npm uninstall')) {
		transformed = transformed.replace(/npm uninstall/g, getCommand(packageManager, 'remove'));
	}

	// Handle other npm commands (start, test, etc.)
	if (command.includes('npm start')) {
		transformed = transformed.replace(/npm start/g, getCommand(packageManager, 'start'));
	}

	if (command.includes('npm test')) {
		transformed = transformed.replace(/npm test/g, getCommand(packageManager, 'test'));
	}

	return transformed;
}
