// import { stripIndent } from 'common-tags/dist/common-tags.min.js'

function trim(str) {
	// return str.replace(/\n$/g, "");
	return str
};

function removeIndent(str) {
	var indentMatches = /\s*\n(\s+)/.exec(str);
	if (indentMatches) {
		var indent = indentMatches[1];
		str = str.replace(new RegExp("^" + indent, "mg"), "");
	}
	// Remove new line at start of string
	str = str.replace(/^\n/, "")
	return str;
}

var output = "";

// function Str(this: any) {
export class Str {
	constructor() {
		function init(strings?: any, ...values: any): any {

			if (Array.isArray(strings)) {
				let str = '';

				strings.forEach((string, a) => {
					// Avoids zeros being squished
					if (values[a] === 0) values[a] = values[a].toString()

					str += string + (values[a] || '');

				});

				output += removeIndent(str)

			}

			if (!strings) {
				return output
			}
		}

		init.prepend = function (strings?: any, ...values: any): any {

			if (Array.isArray(strings)) {
				let str = '';

				strings.forEach((string, a) => {
					// Avoids zeros being squished
					if (values[a] === 0) values[a] = values[a].toString()

					str += string + (values[a] || '');

				});

				output = removeIndent(str) + output

			}
		}

		return init
		// }
	}
}


export const str = new Str() as any
