// import { marked } from 'marked';
// import { _process, preprocess } from './stancyPreprocess';


// function replaceRequestBody(body) {
// 	return _process(
// 		body,
// 		preprocess('content', (data) => {
// 			return marked(data);
// 		})
// 	);
// }

// /** @type {import('@sveltejs/kit').HandleFetch} */
// export async function handleFetch({ request, fetch }) {
// 	// Perform the original fetch request
// 	const response = await fetch(request);

// 	// Check if the response is JSON
// 	if (response.headers.get('content-type')?.includes('application/json')) {
// 		const clonedResponse = response.clone();
// 		let data = await clonedResponse.json();

// 		// Modify the JSON data as needed
// 		// data.modified = true; // Example modification
// 		data = replaceRequestBody(data)

// 		// Create a new response with the modified JSON
// 		const modifiedResponse = new Response(JSON.stringify(data), {
// 			status: response.status,
// 			statusText: response.statusText,
// 			headers: {
// 				...Object.fromEntries(response.headers),
// 				'content-type': 'application/json',
// 			},
// 		});

// 		return modifiedResponse;
// 	}

// 	// If not JSON, return the original response
// 	return response;
// }

// export async function handle({ event, resolve }) {
// 	// Call the default resolve function to get the response
// 	const response = await resolve(event);

// 	// Check if the response is JSON
// 	if (response.headers.get('content-type')?.includes('application/json')) {
// 		const clonedResponse = response.clone();
// 		let data = await clonedResponse.json();

// 		// Modify the JSON data as needed
// 		//   data.modified = true; // Example modification
// 		data = replaceRequestBody(data)

// 		// Create a new response with the modified JSON
// 		const modifiedResponse = new Response(JSON.stringify(data), {
// 			status: response.status,
// 			statusText: response.statusText,
// 			headers: {
// 				...Object.fromEntries(response.headers),
// 				'content-type': 'application/json',
// 			},
// 		});

// 		return modifiedResponse;
// 	}

// 	// If not JSON, return the original response
// 	return response;
// }
