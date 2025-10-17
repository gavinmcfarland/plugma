import { detect } from 'package-manager-detector/detect';
import { resolveCommand } from 'package-manager-detector/commands';
import { radio, spawnWithColors, stream } from 'askeroo';

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
	 * Dependencies to install (package names). Pass empty array to install from package.json
	 */
	dependencies?: string[];

	/**
	 * Enable debug output
	 */
	debug?: boolean;
}

/**
 * Install dependencies using the specified package manager
 */
async function installAllDependencies(packageManager: string, dependencies: string[]): Promise<void> {
	const output = await stream(`Installing dependencies with ${packageManager}...`, {
		maxLines: 15,
		prefixSymbol: '│',
	});

	// Install all packages - if we have specific packages, add them; otherwise just install from package.json
	const command = dependencies.length > 0 ? 'add' : 'install';
	const resolved = resolveCommand(packageManager as any, command, dependencies);
	if (!resolved) {
		throw new Error(`Could not resolve package manager command for ${packageManager}`);
	}

	await new Promise<void>((resolve, reject) => {
		const proc = spawnWithColors(resolved.command, resolved.args);

		proc.stdout.on('data', (data) => output.write(data.toString()));
		proc.stderr.on('data', (data) => output.write(data.toString()));
		proc.on('error', (err) => {
			output.error(`Failed to start ${packageManager}: ${err.message}`);
			reject(err);
		});
		proc.on('close', (code) => {
			if (code === 0) {
				output.complete();
				resolve();
			} else {
				output.error();
				reject(new Error(`${packageManager} install failed with code ${code}`));
			}
		});
	});
}

export interface DependencyInstallationResult {
	packageManager: string | null;
	installationFailed: boolean;
}

/**
 * Check if a command is available in the system PATH
 */
async function isCommandAvailable(command: string): Promise<boolean> {
	try {
		const { execSync } = await import('node:child_process');
		const which = process.platform === 'win32' ? 'where' : 'which';
		execSync(`${which} ${command}`, { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

/**
 * Prompts the user for dependency installation and installs dependencies
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
		dependencies = [],
		debug = false,
	} = options;

	let installationFailed = false;

	// Detect package manager if not provided
	const detectedPM = await detect({ cwd: process.cwd() });
	const defaultPM = detectedPM?.agent || preferredPM;

	let packageManager: string | null = null;

	// Determine package manager based on options
	if (!skipInstallPrompt && installDependencies) {
		// Check which package managers are available
		const allOptions = [
			{ value: 'npm', label: 'npm' },
			{ value: 'pnpm', label: 'pnpm' },
			{ value: 'yarn', label: 'yarn' },
			{ value: 'bun', label: 'bun' },
			{ value: 'deno', label: 'deno' },
		];

		const availableOptions = await Promise.all(
			allOptions.map(async (opt) => ({
				...opt,
				available: await isCommandAvailable(opt.value),
			})),
		);

		const packageManagerOptions = [
			{ value: 'skip', label: 'Skip' },
			...availableOptions.filter((opt) => opt.available),
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
		try {
			await installAllDependencies(packageManager, dependencies);
		} catch (error) {
			installationFailed = true;
			if (debug) {
				console.error('Dependency installation error:', error);
			}
		}
	}

	return { packageManager, installationFailed };
}
