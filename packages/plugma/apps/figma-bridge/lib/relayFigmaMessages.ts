import { addMessageListener } from "../../shared/lib/addMessageListener";
import { postMessageVia } from "../../shared/lib/postMessageVia";

// Pass messages between main and figma-bridge iframe
export function relayFigmaMessages(client: any) {
	// If message received from window
	addMessageListener(
		{ client, enableWebSocket: window.runtimeData.websockets },
		"window",
		(event) => {
			// If message received from figma for to iframe and browser
			if (event.origin === "https://www.figma.com") {
				postMessageVia(
					{
						iframeTarget: iframe,
						client,
						enableWebSocket: window.runtimeData.websockets,
					},
					["iframe", "ws"],
					event.data,
				);
			} else {
				// Otherwise, post message to parent
				postMessageVia(
					{
						iframeTarget: iframe,
						client,
						enableWebSocket: window.runtimeData.websockets,
					},
					["parent"],
					event.data,
				);
			}
		},
	);

	addMessageListener(
		{ client, enableWebSocket: window.runtimeData.websockets },
		["ws"],
		(event) => {
			// If client receives message, forward (post) it to the parent
			// TODO: Filter out messages sent by framework
			postMessageVia(
				{
					iframeTarget: iframe,
					client,
					enableWebSocket: window.runtimeData.websockets,
				},
				["parent"],
				event.data,
			);
		},
	);
}
