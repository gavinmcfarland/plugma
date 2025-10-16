import { exec } from 'node:child_process';
import { detect } from 'package-manager-detector/detect';
import { resolveCommand } from 'package-manager-detector/commands';
import { radio, tasks } from 'askeroo';

export interface DependencyInstallationOptions {
	/**
	 * Skip the installation prompt and use the default behavior
	 */
	skipInstallPrompt?: boolean;

	/**
	 * Whether to install dependencies (when skipInstallPrompt is true)
	 */
	installDependencies?: boolean;

	/**
	 * Preferred package manager detected from the environment
	 */
	preferredPM?: string;

	/**
	 * Pre-selected package manager (skips prompt)
	 */
	selectedPackageManager?: string | null;

	/**
	 * Project dependencies to install from package.json
	 */
	projectDependencies?: boolean;

	/**
	 * Add-on/addon specific dependencies
	 */
	addonDependencies?: string[];

	/**
	 * Add-on/addon specific dev dependencies
	 */
	addonDevDependencies?: string[];

	/**
	 * Enable debug output
	 */
	debug?: boolean;

	/**
	 * Custom callback for installing project dependencies
	 */
	installProjectDepsCallback?: (packageManager: string) => Promise<void>;
}

/**
 * Install specific dependencies using the package manager
 */
async function installSpecificDependencies(
	dependencies: string[],
	devDependencies: string[],
	packageManager: string,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const resolved = resolveCommand(packageManager as any, 'add', [...dependencies, ...devDependencies]);
		if (!resolved) {
			throw new Error(`Could not resolve package manager command for ${packageManager}`);
		}
		exec(`${resolved.command} ${resolved.args.join(' ')}`, (error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});
	});
}

/**
 * Install project dependencies from package.json
 */
async function installProjectDependencies(packageManager: string): Promise<void> {
	const resolved = resolveCommand(packageManager as any, 'install', []);
	if (!resolved) {
		throw new Error(`Could not resolve package manager command for ${packageManager}`);
	}

	return new Promise((resolve, reject) => {
		exec(`${resolved.command} ${resolved.args.join(' ')}`, (error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});
	});
}

export interface DependencyInstallationResult {
	packageManager: string | null;
	installationFailed: boolean;
}

/**
 * Prompts the user for dependency installation and dynamically adds installation tasks
 * Returns the selected package manager and whether installation failed
 */
export async function promptAndInstallDependencies(
	options: DependencyInstallationOptions,
): Promise<DependencyInstallationResult> {
	const {
		skipInstallPrompt = false,
		installDependencies = true,
		preferredPM = 'npm',
		selectedPackageManager = null,
		projectDependencies = false,
		addonDependencies = [],
		addonDevDependencies = [],
		debug = false,
		installProjectDepsCallback,
	} = options;

	let installationFailed = false;

	// Detect package manager if not provided
	const detectedPM = await detect({ cwd: process.cwd() });
	const defaultPM = detectedPM?.agent || preferredPM;

	// Determine if we have any dependencies to install
	const hasAddonDeps = addonDependencies.length > 0 || addonDevDependencies.length > 0;
	const hasDepsToInstall = projectDependencies || hasAddonDeps;

	// If no dependencies to install, return early
	if (!hasDepsToInstall) {
		return { packageManager: 'skip', installationFailed: false };
	}

	let packageManager: string | null = null;

	// Determine package manager based on options
	if (!skipInstallPrompt && installDependencies) {
		// Prompt user for package manager selection
		const packageManagerOptions = [
			{ value: 'skip', label: 'Skip' },
			{ value: 'npm', label: 'npm' },
			{ value: 'pnpm', label: 'pnpm' },
			{ value: 'yarn', label: 'yarn' },
			{ value: 'bun', label: 'bun' },
			{ value: 'deno', label: 'deno' },
		];

		const initialValue = packageManagerOptions.find((opt) => opt.value === defaultPM)?.value || 'npm';

		packageManager = await radio({
			label: 'Install dependencies?',
			shortLabel: 'Dependencies',
			initialValue,
			options: packageManagerOptions,
			hideOnCompletion: true,
		});
	} else if (skipInstallPrompt) {
		packageManager = 'skip';
	} else {
		packageManager = selectedPackageManager;
	}

	// Install dependencies if a package manager was selected
	if (packageManager && packageManager !== 'skip') {
		await tasks.add([
			{
				label: `Installing dependencies with ${packageManager}`,
				action: async () => {
					try {
						if (projectDependencies && hasAddonDeps) {
							// Install project dependencies first, then addon dependencies
							if (installProjectDepsCallback) {
								await installProjectDepsCallback(packageManager!);
							} else {
								await installProjectDependencies(packageManager!);
							}
							await installSpecificDependencies(addonDependencies, addonDevDependencies, packageManager!);
						} else if (projectDependencies) {
							// Only install project dependencies
							if (installProjectDepsCallback) {
								await installProjectDepsCallback(packageManager!);
							} else {
								await installProjectDependencies(packageManager!);
							}
						} else if (hasAddonDeps) {
							// Only install addon dependencies
							await installSpecificDependencies(addonDependencies, addonDevDependencies, packageManager!);
						}
					} catch (error) {
						installationFailed = true;
						if (debug) {
							console.error('Dependency installation error:', error);
						}
					}
				},
			},
		]);
	}

	return { packageManager, installationFailed };
}
