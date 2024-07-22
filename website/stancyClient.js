import stancy from 'stancy';
// import marked from 'marked';

stancy('content/').server(4000, '/');

// console.log(client)

// client.preprocess('content', (data) => {
// 	return marked(data);
// });

// const client = stancy('content/').client('http://api.com', 'http://localhost:4000');

// client.preprocess('content', (data) => {
// 	return marked(data);
// });

// export default client;
