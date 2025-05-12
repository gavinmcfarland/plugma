import { ListrLogger, ListrLogLevels, ListrLoggerOptions } from 'listr2'
import { LISTR_LOGGER_STYLES } from '../constants.js'

export class DebugAwareLogger extends ListrLogger {
	constructor(
		private debug: boolean,
		options: Partial<ListrLoggerOptions<ListrLogLevels>> = {},
	) {
		super({
			useIcons: false,
			toStderr: [ListrLogLevels.COMPLETED, ListrLogLevels.FAILED],
			...LISTR_LOGGER_STYLES,
			...options,
		})
	}

	log(level: ListrLogLevels, message: any): void {
		if (!this.debug && level === ListrLogLevels.OUTPUT) {
			return // Skip these levels when debug is false
		}
		super.log(level, message)
	}
}

export function createDebugAwareLogger(
	debug?: boolean,
	options?: Partial<ListrLoggerOptions<ListrLogLevels>>,
): DebugAwareLogger {
	return new DebugAwareLogger(debug ?? false, options)
}
