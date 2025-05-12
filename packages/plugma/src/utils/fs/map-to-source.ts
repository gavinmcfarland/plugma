import { type RawSourceMap, SourceMapConsumer } from 'source-map'

import { getDirName } from '../../utils/get-dir-name.js'
import { isNode } from '../../utils/is-node.js'
import { ListrLogLevels } from 'listr2'
import { createDebugAwareLogger } from '../debug-aware-logger.js'

const logger = createDebugAwareLogger()

/** Tracks if source map preloading has completed */
let preloadCompleted = false

const sourceMapCache = new Map<string, SourceMapConsumer>()

/**
 * Maps a position from a compiled file to its original source location using sourcemaps.
 * Handles paths in the format "/path/to/file.js:line:column" or just "/path/to/file.js".
 *
 * @param filePath - The full file path, optionally with line and column numbers
 * @returns The source file path starting with 'src/', or the original path if mapping fails
 */
export async function mapToSource(filePath: string): Promise<string> {
	const [rawPath, line, column] = filePath.split(':')
	if (!rawPath) return filePath

	try {
		// Bail early if not in Node or not a dist file
		if (!isNode() || !rawPath.includes('/dist/')) {
			return cleanSourcePath(filePath)
		}

		// Conditional import for Node-only modules
		const { readFileSync } = await import('node:fs')
		const mapPath = `${rawPath}.map`
		const rawMap = JSON.parse(readFileSync(mapPath, 'utf8')) as RawSourceMap

		let result = filePath
		try {
			const consumer = await new SourceMapConsumer(rawMap)
			const pos = consumer.originalPositionFor({
				line: Number(line) || 1,
				column: Number(column) || 0,
			})

			if (pos.source) {
				const srcPath = pos.source.replace(/^.*?src\//, 'src/')
				result = pos.line ? `${srcPath}:${pos.line}` : srcPath
			}

			consumer.destroy()
		} catch (error) {
			logger.log(ListrLogLevels.FAILED, ['Error mapping source:', error])
		}

		return result
	} catch (error) {
		const srcMatch = filePath.match(/src\/.+/)
		return srcMatch ? srcMatch[0] : filePath
	}
}

/**
 * Synchronous source mapping with async fallback (debug mode only)
 * @warning Only for use in logging paths - blocks event loop during mapping
 */
export function mapToSourceSync(filePath: string): string {
	// Browser gets simple cleanup
	if (!isNode() || !process.env.PLUGMA_DEBUG || !filePath.includes('/dist/')) {
		return cleanSourcePath(filePath)
	}

	// Extract base path without line/column
	const [rawPath, line, column] = filePath.split(':')

	const consumer = sourceMapCache.get(rawPath)

	if (consumer) {
		const result = mapWithConsumer(consumer, Number(line || 1), Number(column || 0), filePath)
		return result
	}

	return cleanSourcePath(filePath)
}

/** Shared path cleanup logic */
function cleanSourcePath(path: string): string {
	return path.replace(/^.*?src\//, 'src/')
}

/** Shared mapping logic using a SourceMapConsumer */
function mapWithConsumer(consumer: SourceMapConsumer, line: number, column: number, originalPath: string): string {
	const pos = consumer.originalPositionFor({ line, column })
	return pos.source ? formatSourcePosition(pos.source, pos.line ?? undefined) : cleanSourcePath(originalPath)
}

/** Format the source file path with optional line number */
function formatSourcePosition(source: string, line?: number): string {
	const srcPath = source.replace(/^.*?src\//, 'src/')
	return line ? `${srcPath}:${line}` : srcPath
}

/**
 * Preloads all source maps from the dist directory
 * Should be called once at startup when debug mode is enabled
 */
export async function preloadSourceMaps(): Promise<void> {
	// Bail entirely in browser
	if (!isNode()) return

	// Keep existing Node-specific implementation
	const { readdirSync, readFileSync } = await import('node:fs')
	const { join } = await import('node:path')

	// Get package's own dist directory
	const packageDistPath = join(getDirName(), '../../')

	async function walkDir(dir: string): Promise<void> {
		const entries = readdirSync(dir, { withFileTypes: true })

		for (const entry of entries) {
			const fullPath = join(dir, entry.name)

			if (entry.isDirectory()) {
				await walkDir(fullPath)
			} else if (entry.isFile() && fullPath.endsWith('.map')) {
				try {
					const rawMap = JSON.parse(readFileSync(fullPath, 'utf8')) as RawSourceMap
					const consumer = await new SourceMapConsumer(rawMap)
					const sourcePath = fullPath.replace(/\.map$/, '')
					sourceMapCache.set(sourcePath, consumer)
				} catch (error) {
					console.error('Error preloading source map:', fullPath, error)
				}
			}
		}
	}

	try {
		await walkDir(packageDistPath)
		preloadCompleted = true
		logger.log(ListrLogLevels.COMPLETED, 'Plugma source maps loaded')
	} catch (error) {
		logger.log(ListrLogLevels.FAILED, ['Failed to preload source maps:', error])
	}
}
