export function interceptDragEnd() {
	const originalAddEventListener = HTMLElement.prototype.addEventListener

	HTMLElement.prototype.addEventListener = function (type, listener, options) {
		if (type === 'dragend' && typeof listener === 'function') {
			const fnSource = listener.toString()
			const callsPostMessage =
				fnSource.includes('parent.postMessage') || fnSource.includes('window.parent.postMessage')

			if (callsPostMessage) {
				const el = this
				let useFiles = false

				// Inject fallback dragstart with dataTransfer
				el.addEventListener('dragstart', (startEvent) => {
					console.log('[Plugma] dragstart', {
						target: el,
						innerHTML: el.innerHTML,
						dataTransfer: startEvent.dataTransfer,
						useFiles,
					})

					if (!startEvent.dataTransfer) {
						console.warn(
							'[Plugma] dataTransfer was null — drag may not be user-initiated or element not draggable',
						)
						return
					}

					if (useFiles) {
						try {
							const file = new File([el.innerHTML], 'icon.svg', {
								type: 'image/svg+xml',
							})
							startEvent.dataTransfer.items.add(file)
							console.log('[Plugma] Added file to dataTransfer.items')
						} catch (err) {
							console.warn('[Plugma] Failed to add file to dataTransfer.items', err)
						}
					} else {
						startEvent.dataTransfer.setData('image/svg+xml', el.innerHTML)
						console.log('[Plugma] Set dataTransfer string as image/svg+xml')
					}
				})

				const wrapped = function (e: DragEvent) {
					// Suppress both `parent.postMessage` and `window.parent.postMessage`
					const fakeParent = {
						postMessage: (...args: any[]) => {
							const [message] = args

							if (message && typeof message === 'object' && 'pluginDrop' in message) {
								console.warn('[Plugma] Suppressed pluginDrop postMessage:', message)

								if ('files' in message.pluginDrop) {
									useFiles = true
								} else if ('items' in message.pluginDrop) {
									useFiles = false
								}
							} else {
								console.log('[Plugma] Forwarding non-pluginDrop postMessage')
								window.top?.postMessage?.(...args)
							}
						},
					}

					const fakeWindow = {
						parent: fakeParent,
					}

					try {
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
