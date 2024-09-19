document.close();
document.addEventListener('keydown', (e) => {
	if (e.keyCode === 80 /* P */ && !e.shiftKey && e.altKey && !e.ctrlKey && e.metaKey) {
		// Handle the plugin re-run shortcut
		window.parent.postMessage('$INTERNAL_DO_NOT_USE$RERUN_PLUGIN$', '*')
		e.stopPropagation()
		e.stopImmediatePropagation()
	} else if (true) {
		// Handle Select All, Undo and Redo in the desktop app
		const ctrlDown = e.metaKey
		if (ctrlDown) {
			if (e.keyCode === 65 /* A */) {
				document.execCommand('selectAll')
			} else if (e.keyCode === 90 /* Z */) {
				if (e.shiftKey) {
					document.execCommand('redo')
				} else {
					document.execCommand('undo')
				}
			} else if ((e.key === 'x' || e.key === 'X') && false) {
				document.execCommand('cut')
			} else if ((e.key === 'c' || e.key === 'C') && false) {
				document.execCommand('copy')
			} else if ((e.key === 'v' || e.key === 'V') && false) {
				document.execCommand('paste')
			}
		}
	}
}, true)

function renderCssVariables(vars) {
	return Object.entries(vars)
		.map((entry) => entry.join(': '))
		.join('; ') + ';'
}

window.addEventListener('message', function (event) {
	if (
		event.source === window.parent.parent.parent &&
		event.data &&
		typeof event.data === 'object' &&
		'figmaMessage' in event.data
	) {
		event.stopImmediatePropagation()

		const figmaMessage = event.data.figmaMessage

		if (figmaMessage.type === 'THEME') {
			const figmaStyle = document.getElementById('figma-style')
			figmaStyle.textContent = ':root { ' + renderCssVariables(figmaMessage.payload.variables) + ' }'

			const classesToRemove = []

			document.documentElement.classList.forEach((value) => {
				if (value.startsWith('figma-')) {
					classesToRemove.push(value)
				}
			})

			for (const className of classesToRemove) {
				document.documentElement.classList.remove(className)
			}

			if (figmaMessage.payload.name && figmaMessage.payload.name !== 'legacy') {
				document.documentElement.classList.add('figma-' + figmaMessage.payload.name)
			}
		}
	}
}, true)

window.addEventListener('load', (event) => {
	document.documentElement.classList.add('figma-light')
});

window.addEventListener('securitypolicyviolation', (event) => {
	try {
		const url = new URL(event.blockedURI)
		console.warn('Failed to load resource from', event.blockedURI, 'since it is not in the list of allowed domains. Please add', '"' + url.origin + '"', 'to the networkAccess > allowedDomains field in your manifest.json.')
	} catch {
		// This is to make sure we don't crash if the blockedURI is not a valid URL.
		// This should never happen since we're getting the url from the Web API, but better safe than sorry.
	}
})
