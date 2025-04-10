import { registry } from './registry'

export function main(name: string, fn: () => void) {
	if (typeof figma === 'undefined') {
		throw new Error(
			'This is awkward... this function should never run outside Figma.\n' +
				'  Did you mean to import { test } from "#plugma/testing"?',
		)
	}

	// console.log('%cregistering test', 'color: blue', name, fn.toString())
	registry.register(name, fn)
}
