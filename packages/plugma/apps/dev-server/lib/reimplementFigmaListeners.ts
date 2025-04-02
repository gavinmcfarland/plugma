/**
 * Reimplements Figma listeners that are lost when the iframe is loaded. These are things like, copy and paste, select all, undo and redo, reponing the plugin.
 * This is necessary because Figma's listeners aren't automatically inherited from the parent window.
 */
export function reimplementFigmaListeners() {
	document.addEventListener(
		'keydown',
		(e) => {
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
		},
		true,
	)
}
