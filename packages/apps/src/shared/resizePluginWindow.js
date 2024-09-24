export function resizePluginWindow() {
	// Experiment to listen for changes to window size
	const resizeObserver = new ResizeObserver((entries) => {
		for (let entry of entries) {
			// Access the size of the entry (the window in this case)
			const { width, height } = entry.contentRect
			console.log(`Window size changed. Width: ${width}, Height: ${height}`)
		}
	})

	// Observe changes on the body or any element related to the window size
	resizeObserver.observe(document.body)
}
