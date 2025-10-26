import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import MagicString from 'magic-string';
import * as commentJson from 'comment-json';
import { Combino } from 'combino';
import ejsMate from '@combino/plugin-ejs-mate';
import rebase from '@combino/plugin-rebase';
import stripTS from '@combino/plugin-strip-ts';

export interface FileHelpers {
	writeFile: (path: string, content: string, options?: { mode?: number }) => Promise<void>;
	writeTemplateFile: (templateDir: string, targetPath: string, data?: Record<string, any>) => Promise<void>;
	readFile: (path: string) => Promise<string>;
	updateFile: (path: string, updater: (content: string) => string) => Promise<void>;
	updateJson: (path: string, updater: (json: any) => void) => Promise<void>;
	exists: (path: string) => Promise<boolean>;
	mkdir: (path: string) => Promise<void>;
	ensureDir: (path: string) => Promise<void>;
	detectTypeScript: () => Promise<boolean>;
	getExtension: (forceJs?: boolean) => Promise<'ts' | 'js'>;
	detectViteConfigFile: () => Promise<string | null>;
	detectTsConfigFile: () => Promise<string | null>;
}

export function createFileHelpers(cwd = process.cwd()): FileHelpers {
	return {
		async writeFile(filePath: string, content: string, options?: { mode?: number }) {
			const fullPath = path.join(cwd, filePath);
			await fs.mkdir(path.dirname(fullPath), { recursive: true });
			await fs.writeFile(fullPath, content, options?.mode ? { mode: options.mode } : undefined);
		},

		async writeTemplateFile(templateDir: string, targetPath: string, data: Record<string, any> = {}) {
			const isTypeScript = await this.detectTypeScript();

			// Resolve the template directory relative to the plugma package
			const currentDir = path.dirname(fileURLToPath(import.meta.url));
			const plugmaRoot = path.resolve(currentDir, '../..');
			const absoluteTemplateDir = path.resolve(plugmaRoot, templateDir);

			// Create a temporary directory for Combino output
			const tempDir = path.join(cwd, '.temp-template-' + Math.random().toString(36).substring(7));

			// Create a temporary .prettierrc in cwd to prevent Prettier from finding parent configs
			const tempPrettierRc = path.join(cwd, '.prettierrc');
			const prettierConfig = {
				useTabs: true,
				semi: true,
				singleQuote: true,
				printWidth: 100,
			};

			// Check if .prettierrc already exists
			let existingPrettierConfig: string | null = null;
			try {
				existingPrettierConfig = await fs.readFile(tempPrettierRc, 'utf-8');
			} catch (error) {
				// File doesn't exist, that's fine
			}

			try {
				// Write temporary Prettier config only if one doesn't exist
				if (!existingPrettierConfig) {
					await fs.writeFile(tempPrettierRc, JSON.stringify(prettierConfig, null, 2));
				}

				// Suppress console warnings during Combino build
				const originalWarn = console.warn;
				const originalError = console.error;
				console.warn = (...args: any[]) => {
					// Suppress Prettier plugin warnings
					const message = args.join(' ');
					if (!message.includes('prettier-plugin-svelte') && !message.includes('Failed to format')) {
						originalWarn.apply(console, args);
					}
				};
				console.error = (...args: any[]) => {
					// Suppress Prettier plugin errors
					const message = args.join(' ');
					if (!message.includes('prettier-plugin-svelte') && !message.includes('Failed to format')) {
						originalError.apply(console, args);
					}
				};

				try {
					// Initialize Combino with explicit warnings disabled to avoid Prettier plugin conflicts
					const combino = new Combino();

					// Build the template to a temporary directory
					await combino.build({
						outputDir: tempDir,
						include: [absoluteTemplateDir],
						data: { typescript: isTypeScript, ...data },
						plugins: [rebase(), ejsMate(), stripTS({ skip: isTypeScript })],
						configFileName: 'template.json',
						warnings: false, // Disable warnings to suppress Prettier plugin issues
					});
				} finally {
					// Restore console methods
					console.warn = originalWarn;
					console.error = originalError;
				}

				// Read the generated file from temp directory
				// The target path might include subdirectories, so we need to find the file in the same relative location
				const tempFilePath = path.join(tempDir, targetPath);

				let content: string;
				try {
					content = await fs.readFile(tempFilePath, 'utf-8');
				} catch (error) {
					// If the exact path doesn't exist, try to find the file by basename
					const fileName = path.basename(targetPath);
					const tempFilePathByName = path.join(tempDir, fileName);

					try {
						content = await fs.readFile(tempFilePathByName, 'utf-8');
					} catch (secondError) {
						// If still not found, list available files for debugging
						const files = await fs.readdir(tempDir, { recursive: true });
						throw new Error(
							`Template file not found at ${tempFilePath} or ${tempFilePathByName}. Available files: ${files.join(', ')}`,
						);
					}
				}

				// Write the processed content to the target location
				await this.writeFile(targetPath, content);
			} finally {
				// Clean up temporary directory and Prettier config
				try {
					await fs.rm(tempDir, { recursive: true, force: true });
				} catch (error) {
					// Ignore cleanup errors
					console.warn(`Warning: Could not clean up temporary directory ${tempDir}:`, error);
				}

				// Remove temporary Prettier config only if we created it
				if (!existingPrettierConfig) {
					try {
						await fs.unlink(tempPrettierRc);
					} catch (error) {
						// Ignore if file doesn't exist or can't be deleted
					}
				}
			}
		},

		async readFile(filePath: string) {
			const fullPath = path.join(cwd, filePath);
			return fs.readFile(fullPath, 'utf-8');
		},

		async updateFile(filePath: string, updater: (content: string) => string) {
			const fullPath = path.join(cwd, filePath);
			try {
				const content = await fs.readFile(fullPath, 'utf-8');
				const updated = updater(content);
				await fs.writeFile(fullPath, updated);
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
					await fs.writeFile(fullPath, updater(''));
				} else {
					throw error;
				}
			}
		},

		async updateJson(filePath: string, updater: (json: any) => void) {
			await this.updateFile(filePath, (content) => {
				let json: Record<string, any> = {};
				try {
					const trimmedContent = content.trim();
					// Use comment-json to parse while preserving comments
					json = content ? (commentJson.parse(trimmedContent) as Record<string, any>) : {};
					updater(json);
					// Use comment-json to stringify while preserving comments
					return commentJson.stringify(json, null, 2) + '\n';
				} catch (error) {
					console.log('Parse error:', error);
					// If parsing fails, start with empty object
					console.warn(`Warning: Could not parse JSON in ${filePath}, starting fresh`);
					updater(json);
					return commentJson.stringify(json, null, 2) + '\n';
				}
			});
		},

		async exists(filePath: string) {
			try {
				await fs.access(path.join(cwd, filePath));
				return true;
			} catch {
				return false;
			}
		},

		async mkdir(dirPath: string) {
			await fs.mkdir(path.join(cwd, dirPath), { recursive: true });
		},

		async ensureDir(dirPath: string) {
			await fs.mkdir(path.join(cwd, dirPath), { recursive: true });
		},

		async detectTypeScript() {
			try {
				// Check for tsconfig.json
				await fs.access(path.join(cwd, 'tsconfig.json'));
				return true;
			} catch {
				try {
					// Check package.json for TypeScript dependency
					const pkgJson = JSON.parse(await fs.readFile(path.join(cwd, 'package.json'), 'utf-8'));
					return !!(pkgJson.dependencies?.typescript || pkgJson.devDependencies?.typescript);
				} catch {
					return false;
				}
			}
		},

		async getExtension(forceJs = false) {
			return (forceJs ? false : await this.detectTypeScript()) ? 'ts' : 'js';
		},

		async detectViteConfigFile() {
			const viteConfigFiles = ['vite.config.ui.ts', 'vite.config.ui.js', 'vite.config.ts', 'vite.config.js'];

			for (const file of viteConfigFiles) {
				try {
					// Check if file exists by trying to read it without modifying
					const content = await this.readFile(file);
					if (content !== null) {
						return file;
					}
				} catch (error) {
					// File doesn't exist, continue to next
					continue;
				}
			}

			return null;
		},

		async detectTsConfigFile() {
			const tsConfigFiles = ['tsconfig.ui.json', 'tsconfig.json'];

			for (const file of tsConfigFiles) {
				try {
					// Check if file exists by trying to read it without modifying
					const content = await this.readFile(file);
					if (content !== null) {
						return file;
					}
				} catch (error) {
					// File doesn't exist, continue to next
					continue;
				}
			}

			return null;
		},
	};
}
