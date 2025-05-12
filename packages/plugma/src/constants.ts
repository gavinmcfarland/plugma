import chalk from 'chalk'
import { color, ListrLogLevels, ListrRendererValue } from 'listr2'

export const LISTR_LOGGER_STYLES = {
	color: {
		[ListrLogLevels.COMPLETED]: (message: string | undefined): string =>
			color.bgGreenBright(color.black(message ?? '')),
		[ListrLogLevels.OUTPUT]: (message: string | undefined): string => chalk.bgGray(message ?? ''),
		[ListrLogLevels.SKIPPED]: (message: string | undefined): string => chalk.bgGray(message ?? ''),
		[ListrLogLevels.FAILED]: (message: string | undefined): string => chalk.bgRed(color.white(message ?? '')),
		[ListrLogLevels.STARTED]: (message: string | undefined): string => chalk.bgBlue(color.white(message ?? '')),
		[ListrLogLevels.PAUSED]: (message: string | undefined): string => chalk.bgGray(color.white(message ?? '')),
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
