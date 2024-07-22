// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production
export const prerender = true;
import { marked } from 'marked';
import { _process, preprocess } from '../stancyPreprocess';

export async function load({ fetch }) {
	const res = await fetch(`__STANCY_SERVER__/index`);
	// const res = await fetch(`__SERVER__/index`);
	// const res = await fetch(`http://localhost:4001/index`);

	const data = await res.json();

	_process(
		data,
		preprocess('content', (data) => {
			return marked(data);
		})
	);

	if (res.ok) {
		return data;
	} else {
		return {
			status: res.status,
			error: new Error('Could not load data')
		};
	}
}
