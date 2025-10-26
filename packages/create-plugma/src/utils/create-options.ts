import { nanoid } from 'nanoid';
import { getRandomPort } from '../shared/index.js';
import { ManifestFile } from '../types.js';

export const DEFAULT_OPTIONS = {
	dockPlugin: false,
	mode: process.env.NODE_ENV,
	port: getRandomPort(),
	output: 'dist',
	websockets: true,
	debug: false,
	watch: false,
	configParser: (value: string) => {
		try {
			return JSON.parse(value);
		} catch (e) {
			console.error('Invalid JSON configuration:', e);
			process.exit(1);
		}
	},
} as const;

export type ReleaseType = 'alpha' | 'beta' | 'stable';

// Minimal options for commands that only need basic functionality
export interface MinimalBaseOptions {
	cwd: string;
	debug?: boolean;
	config?: Record<string, unknown>;
}

// Base options that are common across all commands
export interface BaseOptions extends MinimalBaseOptions {
	mode: string;
	output: string;
	instanceId: string;
	watch?: boolean;
	manifest?: ManifestFile;
	[key: string]: unknown;
}

// Command-specific options
export interface CommandOptions {
	build: BaseOptions & {
		command: 'build';
	};
	dev: BaseOptions & {
		command: 'dev';
		port: number;
		websockets?: boolean;
	};
	preview: BaseOptions & {
		command: 'preview';
		port: number;
		websockets?: boolean;
	};
	test: BaseOptions & {
		command: 'test';
		port: number;
		websockets?: boolean;
	};
	release: BaseOptions & {
		command: 'release';
		type: ReleaseType;
		version?: string;
		title?: string;
		notes?: string;
		prefix?: string;
	};
	add: MinimalBaseOptions & {
		command: 'add';
		integration?: string | string[];
		verbose?: boolean;
		noInstall?: boolean;
		install?: string | boolean;
	};
	create: MinimalBaseOptions & {
		command: 'create';
		dir?: string;
		plugin?: boolean;
		widget?: boolean;
		framework?: string;
		react?: boolean;
		svelte?: boolean;
		vue?: boolean;
		noUi?: boolean;
		template?: string;
		noTypescript?: boolean;
		noIntegrations?: boolean;
		add?: string[] | false;
		noInstall?: boolean;
		install?: string | boolean;
		yes?: boolean;
		verbose?: boolean;
	};
}

// Export individual command types
export type BuildCommandOptions = CommandOptions['build'];
export type DevCommandOptions = CommandOptions['dev'];
export type PreviewCommandOptions = CommandOptions['preview'];
export type TestCommandOptions = CommandOptions['test'];
export type ReleaseCommandOptions = CommandOptions['release'];
export type AddCommandOptions = CommandOptions['add'];
export type CreateCommandOptions = CommandOptions['create'];

// User-provided options
export type UserOptions = {
	[K in keyof CommandOptions]: Partial<Omit<CommandOptions[K], 'cwd'>> & { cwd: string };
}[keyof CommandOptions] & {
	[key: string]: any;
};

export type DefaultOptions = typeof DEFAULT_OPTIONS;

type OptionsConfig = {
	[key: string]: any;
};

type OptionsWithMeta = {
	_meta: {
		raw: Partial<OptionsConfig>;
	};
} & OptionsConfig;

class OptionsMeta {
	raw: Partial<OptionsConfig>;

	constructor(raw: Partial<OptionsConfig>) {
		this.raw = raw;
	}

	toString() {
		return `OptionsMeta { raw: ${JSON.stringify(this.raw)} }`;
	}
}

class Options<T extends OptionsConfig> implements OptionsWithMeta {
	_meta: OptionsMeta;
	[key: string]: any;

	constructor(options: Partial<T>, defaults: T) {
		const resolvedOptions = {
			...defaults,
			...options,
		};

		Object.assign(this, resolvedOptions);
		this._meta = new OptionsMeta(options);

		// Make _meta non-enumerable
		Object.defineProperty(this, '_meta', {
			enumerable: false,
			configurable: true,
			writable: true,
			value: this._meta,
		});
	}

	toString() {
		return `Options { raw: ${JSON.stringify(this._meta.raw)} }`;
	}
}

/**
 * Creates a complete PluginOptions object from user-provided options and defaults
 * @param userOptions - User-provided options (partial)
 * @param defaults - Default options to use when user options are not provided
 * @returns Complete PluginOptions object with all required fields
 */
export function createOptions<T extends keyof CommandOptions>(
	userOptions: Partial<UserOptions>,
	defaults: Partial<CommandOptions[T]> & { command: T },
): CommandOptions[T] & OptionsWithMeta {
	// Ensure required fields are present in defaults
	const requiredDefaults = {
		...DEFAULT_OPTIONS,
		instanceId: nanoid(),
		cwd: process.cwd(),
		...defaults,
	} as unknown as CommandOptions[T];

	// Handle noWebsockets option
	if (userOptions.noWebsockets) {
		userOptions.websockets = false;
		delete userOptions.noWebsockets;
	}

	// Handle --no-ts flag (Commander.js converts --no-ts to typescript: false)
	if ('typescript' in userOptions && userOptions.typescript === false) {
		userOptions.noTypescript = true;
		delete userOptions.typescript;
	}

	// Handle --no-ui flag (Commander.js converts --no-ui to ui: false)
	if ('ui' in userOptions && userOptions.ui === false) {
		userOptions.noUi = true;
		delete userOptions.ui;
	}

	// Handle --no-add flag (Commander.js converts --no-add to add: false)
	if ('add' in userOptions && userOptions.add === false) {
		// Keep add: false as is - we'll use this to detect --no-add
		// Don't delete it, we need it for the create logic
	}

	// Handle --add flag (Commander.js converts --add to add: string[])
	if ('add' in userOptions && Array.isArray(userOptions.add)) {
		// Keep the add array as is - it contains the integration names
		// Don't delete it, we need it for the create logic
	}

	// Handle --no-install flag (Commander.js converts --no-install to install: false)
	if ('install' in userOptions && userOptions.install === false) {
		userOptions.noInstall = true;
		delete userOptions.install;
	}

	// Handle --install <pkg-manager> flag
	if ('install' in userOptions && typeof userOptions.install === 'string') {
		// Keep the install option as is - it contains the package manager name
		// Don't delete it, we need it for the create logic
	}

	// Handle --install flag without package manager (Commander.js converts to install: true)
	// We need to preserve this information to use detected package manager
	if ('install' in userOptions && userOptions.install === true) {
		// Keep the install: true to indicate --install was used without package manager
		// This will be handled in the create logic to use detected package manager
	}

	const newOptions = new Options(userOptions, requiredDefaults) as CommandOptions[T] & OptionsWithMeta;

	return newOptions;
}
