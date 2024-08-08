import v from 'voca'

Object.filter = (obj, predicate) =>
	Object.keys(obj)
		.filter((key) => predicate(key, obj[key]))
		.reduce((res, key) => (res[key] = obj[key], res), {});

export default function (theme) {
	let string = ''
	let selector = ''
	let colors = Object.filter(theme.color, (color) => {
		return color !== 'theme'
	})

	for (let color in colors) {
		let value = colors[color]
		string += `.${selector}${color} {\n`
		string += `	color: ${value};\n`
		string += `}\n`
	}

	return string
}
