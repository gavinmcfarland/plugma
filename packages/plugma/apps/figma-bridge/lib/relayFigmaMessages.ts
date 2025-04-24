import { addMessageListener } from '../../shared/lib/addMessageListener'
import { postMessageVia } from '../../shared/lib/postMessageVia'
import { iframeState, sendMessageToIframe } from './redirectIframe'

/**
 * Responsible for forwarding messages from main to iframe and browser and vice versa.
 * Handles bidirectional communication:
 * - Forwards messages from Figma main to plugin UI and browser
 * - Forwards messages from plugin UI back to Figma main
 * - Forwards messages from browser to Figma main via WebSockets
 */
export function relayFigmaMessages() {
	// If message received from window
	addMessageListener('window', (event) => {
		// If message received from figma (main), send to iframe (plugin ui) and browser (iframe, ws)
		if (event.origin === 'https://www.figma.com') {
			// Use the iframe state to determine how to send the message
			// FIXME: Currently isReady is always false as it's not reactive. So messages are always queued until the server is ready
			if (iframeState.isReady) {
				console.log('sending message', iframeState.isReady)
				postMessageVia(['iframe', 'ws'], event.data)
			} else {
				// If iframe isn't ready, only send to ws and queue the iframe message
				postMessageVia(['ws'], event.data)
				sendMessageToIframe(event.data)
			}
		} else {
			// If message receieved from iframe, send to main
			postMessageVia(['parent'], event.data)
		}
	})

	addMessageListener('ws', (event) => {
		// Forwards message from ws to main
		// If client receives message, forward (post) it to the parent
		// TODO: Filter out messages sent by framework
		postMessageVia(['parent'], event.data)
	})
}
