import { addMessageListener } from '../../shared/lib/addMessageListener'
import { postMessageVia } from '../../shared/lib/postMessageVia'

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
			postMessageVia(['iframe', 'ws'], event.data)
		} else {
			// Otherwise, post message to parent
			postMessageVia(['parent'], event.data)
		}
	})

	addMessageListener('ws', (event) => {
		// If client receives message, forward (post) it to the parent
		// TODO: Filter out messages sent by framework
		postMessageVia(['parent'], event.data)
	})
}
