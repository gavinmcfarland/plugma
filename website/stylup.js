import stylupProcessor from 'stylup';

var matchRecursive = function () {
	var htmlOnly = /(?<=\<[^>]*)/gmi

	var formatParts = /^([\S\s]+?)\.\.\.([\S\s]+)/,
		metaChar = /[-[\]{}()*+?.\\^$|,]/g,
		escape = function (str) {
			return str.replace(metaChar, "\\$&");
		};

	return function (str, format) {
		var p = formatParts.exec(format);
		if (!p) throw new Error("format must include start and end tokens separated by '...'");
		if (p[1] == p[2]) throw new Error("start and end format tokens cannot be identical");

		var opener = p[1],
			closer = p[2],

			/* Use an optimized regex when opener and closer are one character each */
			iterator = new RegExp(format.length == 5 ? "[" + escape(opener + closer) + "]" : escape(opener) + "|" + escape(closer), "g"),
			results = [],
			openTokens, matchStartIndex, match;

		// console.log(iterator.toString())
		var endOfLast = 0
		var lengthOfStr = str.length

		do {
			openTokens = 0;
			while (match = iterator.exec(str)) {
				var matchEndIndex = match.index + 1
				if (match[0] == opener) {
					if (!openTokens)
						matchStartIndex = iterator.lastIndex - 1;
					openTokens++;
				} else if (openTokens) {
					openTokens--;
					if (!openTokens) {
						results.push(str.slice(endOfLast, matchStartIndex));
						if (str[matchStartIndex - 1] === "=") {
							results.push(`"` + str.slice(matchStartIndex, matchEndIndex) + `"`);
						}
						else {
							results.push(str.slice(matchStartIndex, matchEndIndex));
						}
						endOfLast = matchEndIndex
					}
				}
			}
			results.push(str.slice(endOfLast, lengthOfStr));
		} while (openTokens && (iterator.lastIndex = matchStartIndex));

		return results;
	};
}();

var example = `<pre
	bind: this={block}
	{id}
	{style}
	{contenteditable}
	{spellcheck}
	class={_class}
	on: blur={({ target }) => {
		if (contenteditable !== undefined && contenteditable !== 'false') {
			code = target.innerText;
			if (block.querySelector('code') == null) {
				block.innerHTML = '<code></code>';
			}
		}
    }}>`

function processForSvelte(content) {
	return matchRecursive(content, "{...}").join("")
}

export const stylup = {
	markup({ content, filename }) {
		// phtml trips over sveltes markup attribute={handlerbars}. So this replaces those occurances with attribute="{handlebars}"
		content = processForSvelte(content)
		return stylupProcessor.process(content, { from: filename }).then(result => ({ code: result.html, map: null }));
	}
}
