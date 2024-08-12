import v from 'voca'
import { Str } from 'str'

Object.filter = (obj, predicate) =>
	Object.keys(obj)
		.filter((key) => predicate(key, obj[key]))
		.reduce((res, key) => (res[key] = obj[key], res), {});

export default function (theme) {
	let str = new Str()
	let selector = ''
	let colors = Object.filter(theme.color, (color) => {
		return color !== 'theme'
	})

	for (let color in colors) {
		let value = colors[color]
		str.append`
		.${selector}${color} {
			color: ${value};
		}`
	}

	return str.output
}
