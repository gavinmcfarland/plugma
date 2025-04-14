import fs from 'node:fs'
import path from 'node:path'

import createDebug from 'debug'
import type { Plugin, ResolvedConfig } from 'vite'

const debug = createDebug('plugma:vite-plugin:gather-build-outputs')

/**
 * Options for gathering build outputs
 */
interface GatherOptions {
	/**
	 * Source path (file or directory) containing build outputs, relative to project root.
	 * For directories: all matching files will be processed
	 * For files: only the specified file will be processed
	 */
	from: string

	/**
	 * Target path where outputs will be gathered. Interpretation depends on source type:
	 * - If source is file: can be either directory or full file path
	 * - If source is directory: must be a directory path
	 */
	to: string

	/**
	 * Optional function to transform the output path of a path
	 *
	 * @param filePath - The file path relative to sourceDir
	 * @returns The desired output path relative to outputDir
	 */
	transformPath?: (filePath: string) => string

	/**
	 * Filter function to determine which files to gather
	 * @param filePath - The file path relative to sourceDir
	 * @returns Whether to include the file
	 */
	filter?: (filePath: string) => boolean

	/**
	 * Whether to remove the source path after gathering
	 * @remarks
	 * - For directories: removes entire directory recursively
	 * - For files: removes only the specified file
	 * @default false
	 */
	removeSource?: boolean
}

/**
 * Recursively deletes a directory and its contents
 * @internal
 */
const deleteDirectoryRecursively = (dirPath: string): void => {
	if (fs.existsSync(dirPath)) {
		debug('Deleting directory:', dirPath)
		for (const file of fs.readdirSync(dirPath)) {
			const curPath = path.join(dirPath, file)
			if (fs.statSync(curPath).isDirectory()) {
				deleteDirectoryRecursively(curPath)
			} else {
				debug('Deleting file:', curPath)
				fs.unlinkSync(curPath)
			}
		}
		fs.rmdirSync(dirPath)
	}
}

/**
 * Recursively finds all files in a directory or returns single file path
 * @internal
 */
const findFiles = (sourcePath: string, base = ''): string[] => {
	if (fs.statSync(sourcePath).isFile()) {
		debug('Found single file:', sourcePath)
		return [path.basename(sourcePath)]
	}

	debug('Finding files in directory:', sourcePath)
	const entries = fs.readdirSync(sourcePath, { withFileTypes: true })
	const files: string[] = []

	for (const entry of entries) {
		const relativePath = path.join(base, entry.name)
		const fullPath = path.join(sourcePath, entry.name)

		if (entry.isDirectory()) {
			files.push(...findFiles(fullPath, relativePath))
		} else {
			files.push(relativePath)
		}
	}

	return files
}

/**
 * Creates a Vite plugin that gathers build outputs into a single directory.
 *
 * This plugin:
 * 1. Finds all files in the source directory
 * 2. Optionally filters them based on a predicate
 * 3. Copies them to the target directory with optional renaming
 * 4. Optionally removes the source directory
 *
 * @example
 * ```ts
 * // Basic usage - gather outputs to dist/apps/
 * gatherBuildOutputs('dist/apps')
 *
 * // Advanced usage with options
 * gatherBuildOutputs({
 *   sourceDir: 'build',           // Look for files in build/ instead of dist/
 *   outputDir: 'dist/apps',       // Gather files in dist/apps/
 *   getOutputFilename: (file) => `app-${path.basename(file)}`,
 *   filter: (file) => file.endsWith('.html'),  // Only gather HTML files
 *   removeSourceDir: true         // Remove source directory after gathering
 * })
 * ```
 *
 * @param options - Either the target directory string or an options object
 * @returns A Vite plugin
 */
export function gatherBuildOutputs(options: string | GatherOptions): Plugin {
	// Normalize options
	const normalizedOptions: GatherOptions = (() => {
		if (typeof options === 'string') {
			if (!options) throw new Error('Missing required "to" parameter')
			return { from: 'dist', to: options }
		}
		if (!options.from) throw new Error('Missing required "from" in options')
		if (!options.to) throw new Error('Missing required "to" in options')
		return options
	})()

	const {
		from: sourceDir,
		to: outputDir,
		transformPath = (file) => file,
		filter = () => true,
		removeSource = false,
	} = normalizedOptions

	let config: ResolvedConfig

	return {
		name: 'vite-plugin-gather-build-outputs',

		configResolved(resolvedConfig) {
			config = resolvedConfig
			debug('Plugin config resolved:', {
				root: config.root,
				sourceDir,
				outputDir,
			})
		},

		writeBundle: {
			sequential: true,
			handler() {
				try {
					const sourcePath = path.resolve(config.root, sourceDir)
					const targetPath = path.resolve(config.root, outputDir)

					debug('Resolved paths:', { sourcePath, targetPath })

					// Validate source existence and accessibility
					if (!fs.existsSync(sourcePath)) {
						throw new Error(`Source path not found: ${sourcePath}`)
					}
					try {
						fs.accessSync(sourcePath, fs.constants.R_OK)
					} catch (error) {
						throw new Error(`No read access to source path: ${sourcePath}`)
					}

					const isSourceFile = fs.statSync(sourcePath).isFile()
					const files = findFiles(sourcePath).filter(filter)

					// Enforce directory-to-directory rules
					if (!isSourceFile) {
						const targetIsDirectory = fs.existsSync(targetPath)
							? fs.statSync(targetPath).isDirectory()
							: path.extname(targetPath) === ''

						if (!targetIsDirectory) {
							throw new Error('When moving directories, target must be a directory')
						}
					}

					// Create target directory structure
					const targetDirToCreate = isSourceFile ? path.dirname(targetPath) : targetPath

					if (!fs.existsSync(targetDirToCreate)) {
						debug('Creating target directory structure:', targetDirToCreate)
						fs.mkdirSync(targetDirToCreate, { recursive: true })
					}

					for (const file of files) {
						const sourceFilePath = isSourceFile ? sourcePath : path.join(sourcePath, file)

						let outputName = transformPath(file)
						let finalTargetPath = targetPath

						if (isSourceFile) {
							if (fs.statSync(targetPath).isDirectory()) {
								finalTargetPath = path.join(targetPath, outputName)
							}
						} else {
							finalTargetPath = path.join(targetPath, outputName)
						}

						fs.mkdirSync(path.dirname(finalTargetPath), { recursive: true })
						fs.copyFileSync(sourceFilePath, finalTargetPath)
						debug('Copied:', sourceFilePath, '->', finalTargetPath)
					}

					if (removeSource) {
						if (isSourceFile) {
							fs.unlinkSync(sourcePath)
						} else {
							deleteDirectoryRecursively(sourcePath)
						}
					}

					// Final check for directory targets
					if (!isSourceFile && !fs.statSync(targetPath).isDirectory()) {
						throw new Error('Directory operations require directory target')
					}
				} catch (error) {
					console.error('GatherBuildOutputs failed:', error)
					throw error
				}
			},
		},
	}
}

export default gatherBuildOutputs
