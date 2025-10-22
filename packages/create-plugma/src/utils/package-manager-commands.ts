/**
 * Package manager command utilities
 * Centralized logic for generating package manager-specific commands
 */

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun' | 'deno';

export type CommandType = 'install' | 'dev' | 'build' | 'test' | 'lint' | 'start' | 'add' | 'remove';

/**
 * Get a command for a specific package manager and command type
 */
export function getCommand(packageManager: PackageManager, commandType: CommandType): string {
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
 * Get the install command for a specific package manager
 * @deprecated Use getCommand(packageManager, 'install') instead
 */
export function getInstallCommand(packageManager: PackageManager): string {
	return getCommand(packageManager, 'install');
}

/**
 * Get the dev command for a specific package manager
 * @deprecated Use getCommand(packageManager, 'dev') instead
 */
export function getDevCommand(packageManager: PackageManager): string {
	return getCommand(packageManager, 'dev');
}

/**
 * Get the build command for a specific package manager
 * @deprecated Use getCommand(packageManager, 'build') instead
 */
export function getBuildCommand(packageManager: PackageManager): string {
	return getCommand(packageManager, 'build');
}

/**
 * Get all common package manager commands at once
 */
export function getPackageManagerCommands(packageManager: PackageManager) {
	return {
		install: getCommand(packageManager, 'install'),
		dev: getCommand(packageManager, 'dev'),
		build: getCommand(packageManager, 'build'),
		test: getCommand(packageManager, 'test'),
		lint: getCommand(packageManager, 'lint'),
		start: getCommand(packageManager, 'start'),
		add: getCommand(packageManager, 'add'),
		remove: getCommand(packageManager, 'remove'),
	};
}
