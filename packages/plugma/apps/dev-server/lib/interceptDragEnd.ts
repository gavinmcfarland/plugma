export function interceptDragEnd() {
	const originalAddEventListener = HTMLElement.prototype.addEventListener

	HTMLElement.prototype.addEventListener = function (type, listener, options) {
		if (type === 'dragend' && typeof listener === 'function') {
			const fnSource = listener.toString()
			const callsPostMessage =
				fnSource.includes('parent.postMessage') || fnSource.includes('window.parent.postMessage')

			if (callsPostMessage) {
				// console.warn('[Plugma] Intercepting dragend that posts to parent — injecting dragstart fallback')

				const el = this

				// Inject fallback dragstart with dataTransfer
				el.addEventListener('dragstart', (startEvent) => {
					console.log('[Plugma] dragstart', {
						target: el,
						innerHTML: el.innerHTML,
						dataTransfer: startEvent.dataTransfer,
					})

					if (startEvent.dataTransfer) {
						startEvent.dataTransfer.setData('image/svg+xml', el.innerHTML)
					} else {
						console.warn(
							'[Plugma] dataTransfer was null — drag may not be user-initiated or element not draggable',
						)
					}
				})

				const wrapped = function (e: DragEvent) {
					// Suppress both `parent.postMessage` and `window.parent.postMessage`
					const fakeParent = {
						postMessage: (...args: any[]) => {
							const [message] = args

							if (message && typeof message === 'object' && 'pluginDrop' in message) {
								console.warn('[Plugma] Suppressed pluginDrop postMessage:', message)
							} else {
								console.log('[Plugma] Forwarding non-pluginDrop postMessage')
								// Call the real one if it's not pluginDrop
								// You can't access parent.postMessage directly due to cross-origin,
								// so instead send it to the real target using top.postMessage
								window.top?.postMessage?.(...args)
							}
						},
					}

					const fakeWindow = {
						parent: fakeParent,
					}

					try {
						// Wrap the listener function with `parent` and `window` shadowed
						const sandboxedFn = new Function('e', 'parent', 'window', `(${fnSource})(e)`)

						sandboxedFn.call(this, e, fakeParent, fakeWindow)
					} catch (err) {
						console.error('[Plugma] Failed to call original dragend listener:', err)
					}
				}

				return originalAddEventListener.call(this, type, wrapped, options)
			}
		}

		return originalAddEventListener.call(this, type, listener, options)
	}
}
