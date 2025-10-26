import chalk from 'chalk'

// Color and format string with support for nested objects
export function colorStringify(obj: object, indent = 2, level = 0): string {
	const spaces = ' '.repeat(indent * level)
	const nextSpaces = ' '.repeat(indent * (level + 1))

	const formatted = Object.entries(obj)
		.map(([key, value]) => {
			let coloredValue: string

			// Special handling for plugins
			if (key === 'plugins') {
				if (Array.isArray(value)) {
					const pluginNames = value.flatMap((plugin) => {
						// Handle plugin factories that return arrays
						if (Array.isArray(plugin)) {
							return plugin.map((p) => p.name || 'unnamed-plugin')
						}
						return plugin.name || (typeof plugin === 'string' ? plugin : 'unnamed-plugin')
					})
					coloredValue = chalk.cyan(`[${pluginNames.join(', ')}]`)
				} else if (typeof value === 'object' && value !== null) {
					coloredValue = chalk.cyan(`[${value.name || 'unnamed-plugin'}]`)
				} else {
					coloredValue = String(value)
				}
			} else if (typeof value === 'object' && value !== null) {
				// Handle nested objects recursively
				coloredValue = colorStringify(value, indent, level + 1)
			} else if (typeof value === 'number') {
				coloredValue = chalk.yellow(value.toString())
			} else if (typeof value === 'string') {
				coloredValue = chalk.green(`"${value}"`)
			} else if (typeof value === 'boolean') {
				coloredValue = value ? chalk.blue(value.toString()) : chalk.red(value.toString())
			} else if (value === null) {
				coloredValue = chalk.gray('null')
			} else if (value === undefined) {
				coloredValue = chalk.gray('undefined')
			} else {
				coloredValue = String(value)
			}

			return `${nextSpaces}${key}: ${coloredValue}`
		})
		.join(',\n')

	return `{\n${formatted}\n${spaces}}`
}
