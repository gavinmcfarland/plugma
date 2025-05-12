import chalk from 'chalk'
import { color, ListrLogLevels, ListrRendererValue } from 'listr2'

export const LISTR_LOGGER_STYLES = {
	color: {
		[ListrLogLevels.COMPLETED]: (message: string | undefined): string => chalk.green(message ?? ''),
		[ListrLogLevels.OUTPUT]: (message: string | undefined): string => chalk.magenta(message ?? ''),
		[ListrLogLevels.SKIPPED]: (message: string | undefined): string => chalk.yellow(message ?? ''),
		[ListrLogLevels.FAILED]: (message: string | undefined): string => chalk.red(message ?? ''),
		[ListrLogLevels.STARTED]: (message: string | undefined): string => chalk.yellow(message ?? ''),
		[ListrLogLevels.PAUSED]: (message: string | undefined): string => chalk.gray(message ?? ''),
	},
}

export const DEFAULT_RENDERER_OPTIONS = {
	renderer: 'default' as ListrRendererValue,
	rendererOptions: {
		// showSubtasks: false,
		collapseSubtasks: false,
	},
}

export const SILENT_RENDERER_OPTIONS = {
	renderer: 'silent' as ListrRendererValue,
}
