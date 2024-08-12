import { Str } from 'str'

export default (theme) => {
	let name = 'font-size'

	let abbr = theme.property.fontSize.abbr

	let o = theme.size.font

	let str = new Str()

	str.append`:where(html) {`
	for (let i = 0; i < o.length; i++) {
		let modifier = o[i]
		str.append`	--${name}: ${modifier};`
	}

	str.append`}`
	return str.output
}
