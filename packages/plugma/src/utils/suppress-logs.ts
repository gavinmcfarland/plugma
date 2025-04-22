import type { PluginOptions } from '../core/types.js'

type Pattern = RegExp | string

/**
 * Suppresses specific log patterns during build and development
 * @param options - Plugin options containing output path
 */
export function suppressLogs(options: any): void {
	// need to remove any trailing slashes for it to match correctly
	const output = options.output.replace(/\/+$/, '') // Removes trailing slash(es)
	const escapedOutput = output.replace(/\//g, '\\/')

	const MAIN_BUILT_REGEX = new RegExp(
		`^${escapedOutput}/index\\.html\\s+\\d+(\\.\\d+)?\\s+kB\\s+│\\s+gzip:\\s+\\d+(\\.\\d+)?\\s+kB(\\s+│\\s+map:\\s+\\d+(\\.\\d+)?\\s+kB)?$`,
	)
	const INDEX_BUILT_REGEX = new RegExp(
		`^${escapedOutput}/main\\.js\\s+\\d+(\\.\\d+)?\\s+kB\\s+│\\s+gzip:\\s+\\d+(\\.\\d+)?\\s+kB(\\s+│\\s+map:\\s+\\d+(\\.\\d+)?\\s+kB)?$`,
	)
	const TEMP_INDEX_PATH_REGEX = new RegExp(
		`^${escapedOutput}/node_modules/plugma/tmp/index\\.html\\s+\\d+(\\.\\d+)?\\s+kB\\s+│\\s+gzip:\\s+\\d+(\\.\\d+)?\\s+kB$`,
	)

	const patterns: Pattern[] = [
		/^vite v\d+\.\d+\.\d+ building for \w+\.\.\.$/,
		/^build started\.\.\.(\s+\(x\d+\))?$/,
		/^✓ \d+ module(s)? transformed\.$/,
		/^✓?\s*built in \d+(\.\d+)?ms\.?$/,
		/^✓?\s*built in \d+(\.\d+)?s\.?$/,
		/^watching for file changes...$/,
		TEMP_INDEX_PATH_REGEX,
		MAIN_BUILT_REGEX,
		INDEX_BUILT_REGEX,
		'transforming',

		// Add error message patterns
		/^failed to load config from/,
	]

	const originalStdoutWrite = process.stdout.write.bind(process.stdout)
	const originalStderrWrite = process.stderr.write.bind(process.stderr)
	const originalLog = console.log
	const originalError = console.error

	/**
	 * Removes ANSI color codes from a string
	 * @param str - String to clean
	 * @returns String without ANSI codes
	 */
	function stripAnsiCodes(str: string): string {
		return str.replace(/\u001B\[\d{1,2}(;\d{1,2})?m/g, '').trim()
	}

	/**
	 * Checks if a message matches any pattern (string or regex)
	 * @param message - Message to check
	 * @param patterns - Array of patterns to match against
	 * @returns Whether the message matches any pattern
	 */
	function matchesPattern(message: string, patterns: Pattern[]): boolean {
		return patterns.some((pattern) =>
			pattern instanceof RegExp ? pattern.test(message) : message.includes(pattern),
		)
	}

	// Override console.log with a filter based on the provided patterns
	console.log = (...args: unknown[]): void => {
		const message = args.join(' ')
		const cleanMessage = stripAnsiCodes(message)

		if (!matchesPattern(cleanMessage, patterns)) {
			originalLog(...args)
		}
	}

	// Add console.error override
	console.error = (...args: unknown[]): void => {
		const message = args.join(' ')
		const cleanMessage = stripAnsiCodes(message)

		if (!matchesPattern(cleanMessage, patterns)) {
			originalError(...args)
		}
	}

	// Override process.stdout.write and process.stderr.write
	process.stdout.write = ((
		chunk: string | Uint8Array,
		encoding?: BufferEncoding | ((error?: Error | null) => void),
		callback?: (error?: Error | null) => void,
	): boolean => {
		const message = chunk.toString()
		const cleanMessage = stripAnsiCodes(message)

		if (!matchesPattern(cleanMessage, patterns)) {
			return originalStdoutWrite(chunk, encoding as BufferEncoding, callback)
		}

		if (typeof callback === 'function') {
			callback()
		}

		return true
	}) as typeof process.stdout.write

	process.stderr.write = ((
		chunk: string | Uint8Array,
		encoding?: BufferEncoding | ((error?: Error | null) => void),
		callback?: (error?: Error | null) => void,
	): boolean => {
		const message = chunk.toString()
		const cleanMessage = stripAnsiCodes(message)

		if (!matchesPattern(cleanMessage, patterns)) {
			return originalStderrWrite(chunk, encoding as BufferEncoding, callback)
		}

		if (typeof callback === 'function') {
			callback()
		}

		return true
	}) as typeof process.stdout.write
}
