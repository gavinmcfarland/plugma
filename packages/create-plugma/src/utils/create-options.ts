export const DEFAULT_OPTIONS = {} as const;

// Minimal options for commands that only need basic functionality
export interface MinimalBaseOptions {
	cwd: string;
	debug?: boolean;
}

// Command-specific options
export interface CommandOptions {
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
		cwd: process.cwd(),
		...defaults,
	} as unknown as CommandOptions[T];

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

	// Handle --install <pkg-manager> flag (string value)
	// Keep the install option as is - it contains the package manager name
	// Don't delete it, we need it for the create logic

	// Handle --install flag without package manager (Commander.js converts to install: true)
	// Note: The fix for Commander.js incorrectly setting install: true is now handled
	// in parse-add-args.ts by checking process.argv. So if install: true is here,
	// it means --install was actually passed.

	const newOptions = new Options(userOptions, requiredDefaults) as CommandOptions[T] & OptionsWithMeta;

	return newOptions;
}
