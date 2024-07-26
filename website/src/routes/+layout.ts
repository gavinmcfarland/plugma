import { Marked } from 'marked';
import { _process, preprocess } from '../stancyPreprocess';
import hljs from 'highlight.js';
import { markedHighlight } from 'marked-highlight';

// marked.setOptions({
// 	highlight: function (code, language) {
// 		const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
// 		return hljs.highlight(validLanguage, code).value;
// 	}
// });

const marked = new Marked(
	markedHighlight({
		langPrefix: 'hljs language-',
		highlight(code, lang, info) {
			const language = hljs.getLanguage(lang) ? lang : 'plaintext';
			return hljs.highlight(code, { language }).value;
		}
	})
);

function replaceRequestBody(body) {
	return _process(
		body,
		preprocess('content', (data) => {
			// console.log(marked(data));
			// return marked(data);
			return marked.parse(data);
		})
	);
}

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ fetch, url }) {
	let pathname;
	if (url.pathname === '/') {
		pathname = '/home';
	} else {
		pathname = url.pathname;
	}
	const res = await fetch(`__STANCY_SERVER__${pathname}`);

	const text = await res.text();

	let ok = !text.startsWith('[Stancy] No value that matches query');

	// console.log(ok);

	if (ok) {
		// console.log('test');
		// const data = await res.json();
		return replaceRequestBody(JSON.parse(text));
	} else {
		return {
			status: res.status,
			error: new Error('Could not load data')
		};
	}
}
