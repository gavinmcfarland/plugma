import ejsEngine from 'ejs'
import { Plugin, FileHookContext, TemplateInfo } from 'combino'
import * as fs from 'fs'
import * as path from 'path'

// ===== TYPES =====

class Block {
	private html: string[] = []

	toString(): string {
		return this.html.join('\n')
	}

	append(more: string): Block {
		this.html.push(more)
		return this
	}

	prepend(more: string): Block {
		this.html.unshift(more)
		return this
	}

	replace(instead: string): Block {
		this.html = [instead]
		return this
	}
}

interface EjsRenderingContext {
	block: (name: string, html?: string) => Block | undefined
	layout: (view: string) => void
	partial: (view: string) => string
	[key: string]: any
}

interface LayoutResult {
	content: string
	id: string
}

interface BlockProcessingState {
	inBlock: boolean
	currentBlockName: string | null
	currentBlockContent: string[]
	blockStartIndex: number
	blockIndentation: string
}

// ===== CONSTANTS =====

const PATTERNS = {
	explicitLayout: /<% layout\(['"]([^'"]+)['"]\) %>/,
	blockStart: /^\s*<%\s*block\(['"]([^'\"]+)['"]\)\s*%>\s*$/,
	blockEnd: /^\s*<%\s*end\s*%>\s*$/,
	inlineBlock: /<% block\(['"]([^'\"]+)['"]\) %>([^<]*)<% end %>/g,
	layoutBlockStart: /^(\s*)<% block\('([^']+)'\) %>(\s*)$/,
	bodyBlock: /<%-?\s*body\s*%>/,
} as const

const LAYOUT_EXTENSIONS = ['.ejs', '.md', '.html', '.txt']

// ===== UTILITY FUNCTIONS =====

function resolveLayoutDirectory(templatePath: string, layoutDir: string): string {
	return layoutDir.startsWith('./') || layoutDir.startsWith('../') ? path.resolve(templatePath, layoutDir) : layoutDir
}

function collectLayoutDirectories(context: FileHookContext): string[] {
	const layoutDirectories: string[] = []

	if (context.allTemplates) {
		for (const template of context.allTemplates) {
			if (template.config?.layout) {
				for (const layoutDir of template.config.layout) {
					const resolvedLayoutDir = resolveLayoutDirectory(template.path, layoutDir)
					if (!layoutDirectories.includes(resolvedLayoutDir)) {
						layoutDirectories.push(resolvedLayoutDir)
					}
				}
			}
		}
	}

	return layoutDirectories
}

function shouldSkipProcessing(context: FileHookContext): boolean {
	return context.sourcePath.includes('/output/') || context.sourcePath.includes('\\output\\')
}

function resolveLayoutPath(sourcePath: string, layoutPath: string): string {
	return path.resolve(path.dirname(sourcePath), layoutPath)
}

function fileExistsWithExtensions(basePath: string, extensions: string[] = LAYOUT_EXTENSIONS): string | null {
	// Try exact path first
	if (fs.existsSync(basePath)) {
		return basePath
	}

	// Try with extensions
	for (const ext of extensions) {
		const pathWithExt = basePath + ext
		if (fs.existsSync(pathWithExt)) {
			return pathWithExt
		}
	}

	return null
}

function readFileIfExists(filePath: string): string | null {
	try {
		return fs.readFileSync(filePath, 'utf8')
	} catch (error) {
		return null
	}
}

function cleanupBlankLines(content: string): string {
	return content
		.split('\n')
		.reduce((acc, line) => {
			const trimmedLine = line.trim()
			if (acc.length === 0 && trimmedLine === '') return acc

			if (trimmedLine === '') {
				const lastLine = acc[acc.length - 1]
				if (lastLine && lastLine.trim() !== '') {
					acc.push(line)
				}
			} else {
				acc.push(line)
			}
			return acc
		}, [] as string[])
		.join('\n')
		.trim()
}

// ===== BLOCK PROCESSING =====

function createBlockProcessingState(): BlockProcessingState {
	return {
		inBlock: false,
		currentBlockName: null,
		currentBlockContent: [],
		blockStartIndex: 0,
		blockIndentation: '',
	}
}

function processInlineBlocks(content: string): string {
	return content.replace(PATTERNS.inlineBlock, (match, blockName, blockContent) => {
		return `<% block('${blockName}', \`${blockContent.trim()}\`) %>`
	})
}

function processBlockStart(
	line: string,
	state: BlockProcessingState,
	processedLines: string[],
	isLayout: boolean,
): boolean {
	const blockStartMatch = line.match(isLayout ? PATTERNS.layoutBlockStart : PATTERNS.blockStart)
	if (blockStartMatch && !state.inBlock) {
		state.inBlock = true
		state.currentBlockName = blockStartMatch[2] || blockStartMatch[1]
		state.currentBlockContent = []
		state.blockStartIndex = processedLines.length
		state.blockIndentation = blockStartMatch[1] || ''
		processedLines.push(line)
		return true
	}
	return false
}

function processBlockEnd(
	line: string,
	state: BlockProcessingState,
	processedLines: string[],
	isLayout: boolean,
): boolean {
	if (PATTERNS.blockEnd.test(line) && state.inBlock) {
		state.inBlock = false
		const blockContent = state.currentBlockContent.join('\n')

		// Replace the block start line with the appropriate format
		if (isLayout) {
			processedLines[state.blockStartIndex] =
				`${state.blockIndentation}<%= block('${state.currentBlockName}') || \`${blockContent}\` %>`
		} else {
			processedLines[state.blockStartIndex] = `<% block('${state.currentBlockName}', \`${blockContent}\`) %>`
		}

		// Reset state
		state.currentBlockName = null
		state.currentBlockContent = []
		state.blockIndentation = ''
		return true
	}
	return false
}

function processBlocks(content: string, isLayout: boolean = false): string {
	let processedContent = content

	// Handle inline blocks first (only for non-layout content)
	if (!isLayout) {
		processedContent = processInlineBlocks(processedContent)
	}

	const lines = processedContent.split('\n')
	const processedLines: string[] = []
	const state = createBlockProcessingState()

	for (const line of lines) {
		// Try to process block start
		if (processBlockStart(line, state, processedLines, isLayout)) {
			continue
		}

		// Try to process block end
		if (processBlockEnd(line, state, processedLines, isLayout)) {
			continue
		}

		// Collect block content or regular lines
		if (state.inBlock) {
			state.currentBlockContent.push(line)
		} else {
			processedLines.push(line)
		}
	}

	return processedLines.join('\n')
}

// ===== RENDERING =====

function createBlockFunction(
	blocks: Record<string, Block>,
	isLayout: boolean,
): (name: string, html?: string) => Block | undefined {
	if (isLayout) {
		return (name: string): Block | undefined => blocks[name] || undefined
	}

	return (name: string, html?: string): Block | undefined => {
		if (!blocks[name]) {
			blocks[name] = new Block()
		}
		if (html) {
			blocks[name].append(html)
		}
		return blocks[name]
	}
}

function createRenderingContext(
	data: Record<string, any>,
	blocks: Record<string, Block>,
	isLayout: boolean = false,
	body?: string,
): EjsRenderingContext {
	const context: EjsRenderingContext = {
		...data,
		block: createBlockFunction(blocks, isLayout),
		layout: (): void => {},
		partial: (view: string): string => {
			console.warn(`Partial '${view}' not found - partials not yet implemented`)
			return ''
		},
	}

	if (isLayout && body) {
		context.body = body
	}

	return context
}

async function renderWithBlocks(
	content: string,
	data: Record<string, any>,
	ejsOptions: any = {},
): Promise<{ body: string; blocks: Record<string, Block> }> {
	const blocks: Record<string, Block> = {}
	const renderContext = createRenderingContext(data, blocks)

	const rawBody = await ejsEngine.render(content, renderContext, { async: true, ...ejsOptions })
	const body = cleanupBlankLines(rawBody)

	return { body, blocks }
}

async function renderLayout(
	layoutContent: string,
	data: Record<string, any>,
	body: string,
	blocks: Record<string, Block>,
	ejsOptions: any = {},
): Promise<string> {
	const layoutContext = createRenderingContext(data, blocks, true, body)
	return await ejsEngine.render(layoutContent, layoutContext, { async: true, ...ejsOptions })
}

async function processWithoutLayout(content: string, data: Record<string, any>, ejsOptions: any = {}): Promise<string> {
	const blocks: Record<string, Block> = {}
	const renderContext = createRenderingContext(data, blocks)
	return await ejsEngine.render(content, renderContext, { async: true, ...ejsOptions })
}

// ===== LAYOUT PROCESSING =====

function findLayoutInDirectory(layoutDir: string, layoutPath: string): string | null {
	const layoutInConfiguredDir = path.resolve(layoutDir, layoutPath)
	return fileExistsWithExtensions(layoutInConfiguredDir)
}

async function findLayoutContent(context: FileHookContext, layoutPath: string): Promise<string> {
	const resolvedLayoutPath = resolveLayoutPath(context.sourcePath, layoutPath)

	// Try exact path first
	let foundPath = fileExistsWithExtensions(resolvedLayoutPath)
	if (foundPath) {
		const content = readFileIfExists(foundPath)
		if (content !== null) return content
	}

	// Try configured layout directories
	const layoutDirectories = collectLayoutDirectories(context)
	for (const layoutDir of layoutDirectories) {
		foundPath = findLayoutInDirectory(layoutDir, layoutPath)
		if (foundPath) {
			const content = readFileIfExists(foundPath)
			if (content !== null) return content
		}
	}

	throw new Error(`Layout file not found: ${layoutPath}`)
}

async function findDynamicLayout(context: FileHookContext): Promise<string | null> {
	const layoutDirectories = collectLayoutDirectories(context)
	if (layoutDirectories.length === 0) return null

	const currentFileName = path.basename(context.sourcePath)

	// Look for exact filename matches in configured layout directories
	for (const layoutDir of layoutDirectories) {
		const layoutPath = path.resolve(layoutDir, currentFileName)
		const content = readFileIfExists(layoutPath)
		if (content !== null) {
			return content
		}
	}

	return null
}

async function processWithLayout(
	context: FileHookContext,
	layoutPath: string,
	contentToRender: string,
	layoutContent: string,
	ejsOptions: any = {},
): Promise<LayoutResult> {
	// Render content with blocks
	const { body, blocks } = await renderWithBlocks(contentToRender, context.data, ejsOptions)

	// Process and render layout
	const processedLayoutContent = processBlocks(layoutContent, true)
	const renderedContent = await renderLayout(processedLayoutContent, context.data, body, blocks, ejsOptions)

	return { content: renderedContent, id: context.id }
}

// ===== MAIN PLUGIN =====

export default function plugin(options: { patterns?: string[]; [key: string]: any } = {}): Plugin {
	const defaultPatterns = ['*']
	const patterns = options.patterns || defaultPatterns

	// Extract EJS options (everything except patterns)
	const { patterns: _, ...ejsOptions } = options

	// Helper function to check if file matches patterns
	function matchesPatterns(filePath: string): boolean {
		// Extract just the filename from the path
		const fileName = path.basename(filePath)
		return patterns.some((pattern) => {
			const regex = new RegExp(pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.'))
			return regex.test(fileName)
		})
	}

	async function processTemplate(context: FileHookContext): Promise<LayoutResult> {
		// Preprocess blocks
		const preprocessedContent = processBlocks(context.content)

		// Check for explicit layout
		const layoutMatch = preprocessedContent.match(PATTERNS.explicitLayout)
		if (layoutMatch) {
			const contentWithoutLayout = preprocessedContent.replace(PATTERNS.explicitLayout, '')
			const layoutContent = await findLayoutContent(context, layoutMatch[1])
			return await processWithLayout(context, layoutMatch[1], contentWithoutLayout, layoutContent, ejsOptions)
		}

		// Check for dynamic layout in configured directories
		const dynamicLayoutContent = await findDynamicLayout(context)
		if (dynamicLayoutContent) {
			return await processWithLayout(context, 'dynamic', preprocessedContent, dynamicLayoutContent, ejsOptions)
		}

		// No layout, just render EJS
		const renderedContent = await processWithoutLayout(preprocessedContent, context.data, ejsOptions)
		return { content: renderedContent, id: context.id }
	}

	return {
		compile: async (context: FileHookContext) => {
			// Only compile files that match our patterns
			if (!matchesPatterns(context.id)) {
				return
			}

			try {
				if (shouldSkipProcessing(context)) {
					return
				}

				return await processTemplate(context)
			} catch (error) {
				throw new Error(`Error processing EJS-Mate template: ${error}`)
			}
		},
	}
}
