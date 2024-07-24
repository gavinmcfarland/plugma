// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production
export const prerender = true;

// import { marked } from 'marked';
// import { _process, preprocess } from '../stancyPreprocess';

// function replaceRequestBody(body) {
// 	return _process(
// 		body,
// 		preprocess('content', (data) => {
// 			return marked(data);
// 		})
// 	);
// }

// /** @type {import('./$types').PageLoad} */

// export async function load({ fetch }) {
// 	const res = await fetch(`__STANCY_SERVER__/index`);

// 	const data = await res.json();

// 	if (res.ok) {
// 		return replaceRequestBody(data);
// 	} else {
// 		return {
// 			status: res.status,
// 			error: new Error('Could not load data')
// 		};
// 	}
// }
