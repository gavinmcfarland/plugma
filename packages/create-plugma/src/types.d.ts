declare module 'enquirer' {
	export class Select {
		constructor(options: any)
		run(): Promise<any>
	}
	export class Confirm {
		constructor(options: any)
		run(): Promise<any>
	}
	export class Input {
		constructor(options: any)
		run(): Promise<any>
	}
	export class Toggle {
		constructor(options: any)
		run(): Promise<any>
	}
}

declare module 'ini' {
	export function parse(str: string): any
	export function stringify(obj: any): string
}

declare module 'strip-ts' {
	export function stripTSFromString(content: string, fileType: string): Promise<string>
}

declare module 'lodash' {
	const _: any
	export default _
	export const templateSettings: any
}

declare module 'slugify' {
	function slugify(text: string): string
	export default slugify
}

declare module 'chalk' {
	const chalk: {
		red: (text: string) => string
		yellow: (text: string) => string
		gray: (text: string) => string
		green: (text: string) => string
	}
	export default chalk
}

// Node.js built-in modules
declare module 'fs' {
	export function readFileSync(path: string, encoding: string): string
	export function writeFileSync(path: string, data: string, encoding: string): void
	export function existsSync(path: string): boolean
	export function readdirSync(path: string, options?: any): any[]
	export function statSync(path: string): any
	export function mkdirSync(path: string, options?: any): void
	export function rmSync(path: string, options?: any): void
}

declare module 'path' {
	export function join(...paths: string[]): string
	export function dirname(path: string): string
	export function relative(from: string, to: string): string
	export function basename(path: string): string
	export function extname(path: string): string
	export const sep: string
	const path: {
		join: (...paths: string[]) => string
		dirname: (path: string) => string
		relative: (from: string, to: string) => string
		basename: (path: string) => string
		extname: (path: string) => string
		sep: string
	}
	export default path
}

declare module 'url' {
	export function fileURLToPath(url: string): string
}

declare var process: {
	cwd(): string
	argv: string[]
	exit(code: number): never
}
