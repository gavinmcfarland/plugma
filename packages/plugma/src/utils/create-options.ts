import { nanoid } from 'nanoid';
import { getRandomPort } from '../utils/get-random-port.js';
import { ManifestFile } from '../core/types.js';

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
		integration?: string;
	};
}

// Export individual command types
export type BuildCommandOptions = CommandOptions['build'];
export type DevCommandOptions = CommandOptions['dev'];
export type PreviewCommandOptions = CommandOptions['preview'];
export type TestCommandOptions = CommandOptions['test'];
export type ReleaseCommandOptions = CommandOptions['release'];
export type AddCommandOptions = CommandOptions['add'];

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

	const newOptions = new Options(userOptions, requiredDefaults) as CommandOptions[T] & OptionsWithMeta;

	return newOptions;
}
