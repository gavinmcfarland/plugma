import { FileHook, Plugin, FileHookContext, FileHookResult } from 'combino'
import path from 'path'
import chalk from 'chalk'

/**
 * Combino Strip TS Plugin
 * Provides TypeScript stripping functionality and file commenting
 */
class CombinoStripTSPlugin {
	private initialized = false
	public stripTSFromString: any = null

	async initialize(): Promise<void> {
		if (this.initialized) return
		try {
			// Dynamically import strip-ts
			const stripTS = await import('strip-ts')
			this.stripTSFromString = stripTS.stripTSFromString
			this.initialized = true
		} catch (error) {
			console.warn(
				"Combino Strip TS plugin requires the 'strip-ts' package to be installed for TypeScript stripping functionality. Please run: npm install strip-ts",
			)
		}
	}

	async render(content: string, data: Record<string, any>): Promise<string> {
		// This plugin doesn't do template rendering, only transform hooks
		return content
	}

	hasTemplateSyntax(content: string): boolean {
		// This plugin doesn't detect template syntax - it should process all files
		return false
	}
}

interface StripTSOptions {
	skip?: boolean
}

/**
 * Combino Strip TS Plugin Factory Function
 * Creates a plugin that provides TypeScript stripping and file commenting functionality
 */
export default function plugin(options: StripTSOptions = {}): Plugin {
	const { skip = false } = options

	const assemble: FileHook = async (context: FileHookContext): Promise<FileHookResult> => {
		const { content } = context
		const targetPath = context.id
		const ext = path.extname(targetPath)
		const filename = path.basename(targetPath)

		// Skip vite-env.d.ts files
		if (filename === 'vite-env.d.ts') {
			return {
				content: content,
				id: context.id,
			}
		}

		// Only process TypeScript files
		if (ext === '.ts' || ext === '.tsx' || ext === '.vue' || ext === '.svelte') {
			// If skip is true, don't strip TypeScript
			if (skip) {
				return {
					content: content,
					id: context.id,
				}
			}

			// Check if this is a TypeScript file (contains TypeScript syntax)
			const hasTypeScriptSyntax =
				content.includes('interface ') ||
				content.includes('type ') ||
				content.includes(': string') ||
				content.includes(': number') ||
				content.includes(': boolean') ||
				content.includes(': any') ||
				content.includes('extends ') ||
				content.includes('implements ') ||
				content.includes('public ') ||
				content.includes('private ') ||
				content.includes('protected ') ||
				content.includes('readonly ') ||
				content.includes('abstract ') ||
				content.includes('override ') ||
				content.includes('declare ') ||
				content.includes('namespace ') ||
				content.includes('module ') ||
				content.includes('enum ') ||
				content.includes('export type ') ||
				content.includes('export interface ') ||
				content.includes('export declare ') ||
				content.includes('<T>') ||
				content.includes('<T,') ||
				content.includes('<T ') ||
				content.includes('as const') ||
				content.includes('as ') ||
				content.includes('satisfies ') ||
				content.includes('keyof ') ||
				content.includes('typeof ') ||
				content.includes('infer ') ||
				content.includes('?:') ||
				content.includes('!:') ||
				content.includes('?.') ||
				content.includes('!.') ||
				content.includes('??') ||
				content.includes('!')

			// if (hasTypeScriptSyntax) {
			try {
				// Initialize the plugin to get strip-ts functionality
				const plugin = new CombinoStripTSPlugin()
				await plugin.initialize()

				if (!plugin.stripTSFromString) {
					console.log(
						chalk.yellow(
							`     ⚠️  strip-ts not available, skipping TypeScript stripping for ${path.basename(targetPath)}`,
						),
					)
					return {
						content: content,
						id: context.id,
					}
				}

				// Map file extension to file type for strip-ts
				let fileType
				if (ext === '.ts') fileType = 'ts'
				else if (ext === '.tsx') fileType = 'tsx'
				else if (ext === '.vue') fileType = 'vue'
				else if (ext === '.svelte') fileType = 'svelte'

				// Process content directly with strip-ts
				const processedContent = await plugin.stripTSFromString(content, fileType)

				if (processedContent && processedContent !== content) {
					// Update the target path to use .js extension for .ts files
					let newTargetPath = context.id
					if (ext === '.ts') {
						newTargetPath = targetPath.replace('.ts', '.js')
					} else if (ext === '.tsx') {
						newTargetPath = targetPath.replace('.tsx', '.jsx')
					}

					// console.log(chalk.gray(`     🔄 Stripped TypeScript from ${path.basename(targetPath)}`))

					return {
						content: processedContent,
						id: newTargetPath,
					}
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error)
				console.log(
					chalk.yellow(
						`     ⚠️  Failed to strip TypeScript from ${path.basename(targetPath)}: ${errorMessage}`,
					),
				)
				return {
					content: content,
					id: context.id,
				}
			}
			// }
		}

		return {
			content: content,
			id: context.id,
		}
	}

	return {
		filePattern: ['*'],
		assemble,
	}
}
