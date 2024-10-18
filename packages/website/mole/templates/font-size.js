import { Str } from 'str'
import range from '../util/range.js'

// --font-size-{02-10}

export default (theme) => {

	let str = new Str()
	str.append`:where(html) {`

	let i = -2;
	while (i < range(-2, 10).length - 2) {
		let mod = i < 0 ? "0".repeat(i * -1) : i + 1
		let value = 1 * Math.round(Math.pow(theme.number['major second'], i) * 100) / 100
		str.append`	--font-size-${mod}: ${value}rem;`
		i++;
	}

	str.append`}`
	return str.output

}
