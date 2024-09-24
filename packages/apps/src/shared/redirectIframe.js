// FIXME: Does this need changing so styles are applied as soon as url is changed, and the rest of the stuff loads when the iframe loads?
export async function redirectIframe(iframe, url) {
	return new Promise((resolve, reject) => {
		// Set the iframe source

		iframe.src = new URL(url).href

		function onIframeLoad() {
			console.log('Iframe successfully redirected to:', iframe.src)

			// Resolve the promise when the iframe is successfully loaded
			resolve('Iframe successfully redirected')
			iframe.removeEventListener('load', onIframeLoad)
		}
		// Listen for the iframe's load event
		iframe.addEventListener('load', onIframeLoad) // Remove the listener after it's called
		// pluginWindowIframe.onload = function () {
		// 	iframeLoaded = true
		// 	console.log('Iframe successfully redirected to:', pluginWindowIframe.src)

		// 	// Resolve the promise when the iframe is successfully loaded
		// 	resolve('Iframe successfully redirected')
		// }

		// Set a timeout in case the iframe fails to load after a certain time
		setTimeout(() => {
			reject(new Error('Iframe redirection timeout or failed'))
		}, 5000) // You can adjust the timeout duration as necessary
	})
}
