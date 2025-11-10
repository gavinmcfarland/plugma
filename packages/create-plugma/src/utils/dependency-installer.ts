import { detect } from 'package-manager-detector/detect';
import { resolveCommand } from 'package-manager-detector/commands';
import { radio, spawnWithColors, stream } from 'askeroo';
import * as fs from 'fs';
import * as path from 'path';
import { getCommand, type PackageManager } from '../shared/index.js';

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
	 * Initial value for the prompt (defaults to preferredPM)
	 */
	initialValue?: string;

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

	/**
	 * Show detailed installation output
	 */
	verbose?: boolean;

	/**
	 * Project path for updating README with package manager commands
	 */
	projectPath?: string;
}

/**
 * Install dependencies using the specified package manager
 */
async function installAllDependencies(
	packageManager: string,
	dependencies: string[],
	verbose: boolean = false,
): Promise<void> {
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

		// Capture all output for error reporting
		let capturedOutput = '';
		let capturedErrors = '';

		proc.stdout.on('data', (data) => {
			const text = data.toString();
			capturedOutput += text;
			if (verbose) {
				output.write(text);
			}
		});
		proc.stderr.on('data', (data) => {
			const text = data.toString();
			capturedErrors += text;
			if (verbose) {
				output.write(text);
			}
		});
		proc.on('error', (err) => {
			output.error(`Failed to start ${packageManager}: ${err.message}`);
			reject(err);
		});
		proc.on('close', (code) => {
			if (code === 0) {
				output.complete(`Dependencies installed with ${packageManager}!`);
				resolve();
			} else {
				// Show captured output on error, even if verbose is disabled
				if (!verbose && (capturedOutput || capturedErrors)) {
					output.write('\nInstallation output:\n');
					if (capturedOutput) output.write(capturedOutput);
					if (capturedErrors) output.write(capturedErrors);
				}
				output.error(`${packageManager} install failed with code ${code}`);
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
 * Update README file with package manager-specific commands
 */
export function updateReadmeWithPackageManager(
	projectPath: string,
	packageManager: string | null,
	debug: boolean = false,
): void {
	if (!packageManager || packageManager === 'skip') {
		if (debug) {
			console.log(`Skipping README update: packageManager=${packageManager}`);
		}
		return;
	}

	const readmePath = path.join(projectPath, 'README.md');

	if (!fs.existsSync(readmePath)) {
		if (debug) {
			console.log(`README not found at: ${readmePath}`);
		}
		return;
	}

	let readmeContent = fs.readFileSync(readmePath, 'utf8');
	const originalContent = readmeContent;

	// Replace npm commands with package manager-specific commands
	const installCommand = getCommand(packageManager as PackageManager, 'install');
	const devCommand = getCommand(packageManager as PackageManager, 'dev');
	const buildCommand = getCommand(packageManager as PackageManager, 'build');

	if (debug) {
		console.log(
			`Updating README with commands: install=${installCommand}, dev=${devCommand}, build=${buildCommand}`,
		);
	}

	// Replace the install command while preserving indentation
	readmeContent = readmeContent.replace(
		/(\s*)```bash\s*\n(\s*)npm install\s*\n(\s*)npm run dev\s*\n(\s*)```/g,
		(match, indent1, indent2, indent3, indent4) => {
			// Use the indentation from the first line (```bash)
			return `${indent1}\`\`\`bash\n${indent2}${installCommand}\n${indent3}${devCommand}\n${indent4}\`\`\``;
		},
	);

	// Replace the build command while preserving indentation
	readmeContent = readmeContent.replace(
		/(\s*)```bash\s*\n(\s*)npm run build\s*\n(\s*)```/g,
		(match, indent1, indent2, indent3) => {
			// Use the indentation from the first line (```bash)
			return `${indent1}\`\`\`bash\n${indent2}${buildCommand}\n${indent3}\`\`\``;
		},
	);

	// Only write if content changed
	if (readmeContent !== originalContent) {
		fs.writeFileSync(readmePath, readmeContent, 'utf8');
		if (debug) {
			console.log(`README updated successfully`);
		}
	} else if (debug) {
		console.log(`No changes needed in README`);
	}
}

/**
 * Update INTEGRATIONS.md file with package manager-specific commands
 */
export function updateIntegrationsWithPackageManager(
	projectPath: string,
	packageManager: string | null,
	debug: boolean = false,
): void {
	if (!packageManager || packageManager === 'skip') {
		if (debug) {
			console.log(`Skipping INTEGRATIONS update: packageManager=${packageManager}`);
		}
		return;
	}

	const integrationsPath = path.join(projectPath, 'INTEGRATIONS.md');

	if (!fs.existsSync(integrationsPath)) {
		if (debug) {
			console.log(`INTEGRATIONS.md not found at: ${integrationsPath}`);
		}
		return;
	}

	let integrationsContent = fs.readFileSync(integrationsPath, 'utf8');
	const originalContent = integrationsContent;

	if (debug) {
		console.log(`Updating INTEGRATIONS.md with package manager: ${packageManager}`);
	}

	// Map to store command replacements
	const commandMap: Record<string, string> = {};

	// Common script commands that might need updating
	const scripts = ['dev', 'format', 'format:check', 'lint', 'vitest', 'playwright'];

	for (const script of scripts) {
		// Get the correct package manager command for running scripts
		let currentCommand: string;
		if (packageManager === 'npm') {
			currentCommand = `npm run ${script}`;
		} else if (packageManager === 'pnpm') {
			currentCommand = `pnpm run ${script}`;
		} else if (packageManager === 'yarn') {
			currentCommand = `yarn ${script}`;
		} else if (packageManager === 'bun') {
			currentCommand = `bun run ${script}`;
		} else {
			currentCommand = getCommand(packageManager as PackageManager, script);
		}
		commandMap[`npm run ${script}`] = currentCommand;
	}

	// Replace all npm run commands
	for (const [oldCmd, newCmd] of Object.entries(commandMap)) {
		integrationsContent = integrationsContent.replace(new RegExp(escapeRegExp(oldCmd), 'g'), newCmd);
	}

	// Replace npx commands if needed (for shadcn, etc.)
	if (packageManager === 'npm') {
		// Keep npx as is for npm
		// No replacement needed
	} else if (packageManager === 'yarn') {
		integrationsContent = integrationsContent.replace(/\bnpx\s+/g, 'yarn dlx ');
	} else if (packageManager === 'pnpm') {
		integrationsContent = integrationsContent.replace(/\bnpx\s+/g, 'pnpm dlx ');
	} else if (packageManager === 'bun') {
		integrationsContent = integrationsContent.replace(/\bnpx\s+/g, 'bunx ');
	}

	// Only write if content changed
	if (integrationsContent !== originalContent) {
		fs.writeFileSync(integrationsPath, integrationsContent, 'utf8');
		if (debug) {
			console.log(`INTEGRATIONS.md updated successfully`);
		}
	} else if (debug) {
		console.log(`No changes needed in INTEGRATIONS.md`);
	}
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
		verbose = false,
		projectPath,
		initialValue = undefined,
	} = options;

	let installationFailed = false;

	// Detect package manager if not provided
	const detectedPM = await detect({ cwd: process.cwd() });
	const defaultPM = detectedPM?.agent || preferredPM;

	let packageManager: string | null = null;

	if (debug) {
		console.log(
			`Debug: skipInstallPrompt=${skipInstallPrompt}, installDependencies=${installDependencies}, selectedPackageManager=${selectedPackageManager}`,
		);
	}

	// Determine package manager based on options
	if (skipInstallPrompt) {
		// Skip the prompt - use the provided package manager or skip
		packageManager = installDependencies ? selectedPackageManager || defaultPM : 'skip';
	} else {
		// Show the prompt to let user choose
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

		// Determine initial value: use provided initialValue if it's available, otherwise try to find defaultPM in available options
		const promptInitialValue =
			(initialValue && packageManagerOptions.find((opt) => opt.value === initialValue)?.value) ||
			packageManagerOptions.find((opt) => opt.value === defaultPM)?.value ||
			'npm';

		packageManager = await radio({
			label: 'Install dependencies?',
			shortLabel: 'Dependencies',
			initialValue: promptInitialValue,
			options: packageManagerOptions,
			hideOnCompletion: true,
		});
	}

	// Install dependencies if a package manager was selected
	if (packageManager && packageManager !== 'skip') {
		try {
			await installAllDependencies(packageManager, dependencies, verbose);
		} catch (error) {
			installationFailed = true;
			if (debug) {
				console.error('Dependency installation error:', error);
			}
		}
	}

	// Update README with package manager-specific commands
	if (projectPath) {
		updateReadmeWithPackageManager(projectPath, packageManager, debug);
		updateIntegrationsWithPackageManager(projectPath, packageManager, debug);
	}

	return { packageManager, installationFailed };
}
