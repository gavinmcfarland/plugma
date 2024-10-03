// FIXME: Is there another function I need to call for this? One that happens before build?
export default function replaceMainInput(options = {}) {
	return {
		name: 'replace-js-input',
		transformIndexHtml: {
			enforce: 'pre',
			transform(html, { mode }) {
				// Modify the script tag's src in the HTML template
				return html.replace(
					'<script type="module" id="entry" src="/src/ui.ts"></script>',
					`<script type="module" id="entry" src="/${options.input}"></script>`
				);
			},
		},
	}
}


// export default function replaceMainInput(options = {}) {
// 	return {
// 		name: 'replace-main-input',
// 		transformIndexHtml(html) {
// 			console.log('Replacing src with:', options.input);
// 			return html.replace('src="/src/ui.ts"', `src="/${options.input}"`);
// 		},
// 	}
// }
