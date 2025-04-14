import fs from 'fs/promises'
import path from 'path'
import MagicString from 'magic-string'
import * as commentJson from 'comment-json'

export interface FileHelpers {
	writeFile: (path: string, content: string) => Promise<void>
	readFile: (path: string) => Promise<string>
	updateFile: (path: string, updater: (content: string) => string) => Promise<void>
	updateJson: (path: string, updater: (json: any) => void) => Promise<void>
	exists: (path: string) => Promise<boolean>
	mkdir: (path: string) => Promise<void>
	detectTypeScript: () => Promise<boolean>
	getExtension: (forceJs?: boolean) => Promise<'ts' | 'js'>
}

export function createFileHelpers(cwd = process.cwd()): FileHelpers {
	return {
		async writeFile(filePath: string, content: string) {
			const fullPath = path.join(cwd, filePath)
			await fs.mkdir(path.dirname(fullPath), { recursive: true })
			await fs.writeFile(fullPath, content)
		},

		async readFile(filePath: string) {
			const fullPath = path.join(cwd, filePath)
			return fs.readFile(fullPath, 'utf-8')
		},

		async updateFile(filePath: string, updater: (content: string) => string) {
			const fullPath = path.join(cwd, filePath)
			try {
				const content = await fs.readFile(fullPath, 'utf-8')
				const updated = updater(content)
				await fs.writeFile(fullPath, updated)
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
					await fs.writeFile(fullPath, updater(''))
				} else {
					throw error
				}
			}
		},

		async updateJson(filePath: string, updater: (json: any) => void) {
			await this.updateFile(filePath, (content) => {
				let json: Record<string, any> = {}
				try {
					const trimmedContent = content.trim()
					// Use comment-json to parse while preserving comments
					json = content ? (commentJson.parse(trimmedContent) as Record<string, any>) : {}
					updater(json)
					// Use comment-json to stringify while preserving comments
					return commentJson.stringify(json, null, 2) + '\n'
				} catch (error) {
					console.log('Parse error:', error)
					// If parsing fails, start with empty object
					console.warn(`Warning: Could not parse JSON in ${filePath}, starting fresh`)
					updater(json)
					return commentJson.stringify(json, null, 2) + '\n'
				}
			})
		},

		async exists(filePath: string) {
			try {
				await fs.access(path.join(cwd, filePath))
				return true
			} catch {
				return false
			}
		},

		async mkdir(dirPath: string) {
			await fs.mkdir(path.join(cwd, dirPath), { recursive: true })
		},

		async detectTypeScript() {
			try {
				// Check for tsconfig.json
				await fs.access(path.join(cwd, 'tsconfig.json'))
				return true
			} catch {
				try {
					// Check package.json for TypeScript dependency
					const pkgJson = JSON.parse(await fs.readFile(path.join(cwd, 'package.json'), 'utf-8'))
					return !!(pkgJson.dependencies?.typescript || pkgJson.devDependencies?.typescript)
				} catch {
					return false
				}
			}
		},

		async getExtension(forceJs = false) {
			return (forceJs ? false : await this.detectTypeScript()) ? 'ts' : 'js'
		},
	}
}
