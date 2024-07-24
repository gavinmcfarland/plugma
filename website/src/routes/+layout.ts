import { marked } from 'marked';
import { _process, preprocess } from '../stancyPreprocess';

function replaceRequestBody(body) {
	return _process(
		body,
		preprocess('content', (data) => {
			return marked(data);
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
