let minimizeWindow = false;
let plugmaPluginWindowSize = {
	width: 300,
	height: 400
}

// Add the event listener
let runtimeData

if (runtimeData.command === "preview") {
	minimizeWindow = true
}

figma.ui.on('message', async (message) => {
	// Check if the message type is "PLUGMA_MINIMISE_WINDOW"
	if (message.event === 'PLUGMA_MINIMISE_WINDOW') {
		minimizeWindow = true;
		figma.ui['re' + 'size'](200, message.toolbarHeight)
	}
	if (message.event === 'PLUGMA_MAXIMISE_WINDOW') {
		minimizeWindow = false;

		figma.ui['re' + 'size'](plugmaPluginWindowSize.width, plugmaPluginWindowSize.height + message.toolbarHeight)
	}
	if (message.event === 'PLUGMA_INCREASE_WINDOW_HEIGHT') {
		minimizeWindow = false;

		figma.ui['re' + 'size'](plugmaPluginWindowSize.width, plugmaPluginWindowSize.height + message.toolbarHeight)
	}
	if (message.event === 'PLUGMA_DECREASE_WINDOW_HEIGHT') {
		minimizeWindow = false;

		figma.ui['re' + 'size'](plugmaPluginWindowSize.width, plugmaPluginWindowSize.height)
	}

	if (message.event === "PLUGMA-DELETE-ROOT-PLUGIN-DATA") {
		let pluginDataKeys = figma.root.getPluginDataKeys();
		for (let i = 0; i < pluginDataKeys.length; i++) {
			let key = pluginDataKeys[i];
			figma.root.setPluginData(key, "");
			console.log(`Pugma: ${key} deleted from root pluginData`);
		}
		figma.notify("Root pluginData deleted");
	}

	if (message.event === "PLUGMA-DELETE-CLIENT-STORAGE") {
		let clientStorageKeys = await figma.clientStorage.keysAsync();
		for (let i = 0; i < clientStorageKeys.length; i++) {
			let key = clientStorageKeys[i];
			if (key !== "figma-stylesheet") {
				await figma.clientStorage.deleteAsync(key);
				console.log(`Pugma: ${key} deleted from clientStorage`);
			}
		}
		figma.notify("ClientStorage deleted");
	}
});

function customResize(width, height) {
	plugmaPluginWindowSize = {
		width,
		height
	}
	console.log('Custom resize: ' + width + 'x' + height);

	// Check if the PLUGMA_MINIMIZE_WINDOW event was triggered
	if (minimizeWindow) {
		height = 40;
	}

	// Call the original figma.ui.resize method if it exists
	if (figma && figma.ui && typeof figma.ui.resize === 'function') {
		// To avoid Vite replacing figma.ui.resize and causing an infinite loop
		figma.ui['re' + 'size'](width, height);
	} else {
		console.warn('Figma UI resize method is not available.');
	}
}

function customShowUI(htmlString, options) {

	if (options && options.height) {
		plugmaPluginWindowSize.height = options.height
	}

	if (options && options.width) {
		plugmaPluginWindowSize.width = options.width
	}


	// Check if the PLUGMA_MINIMIZE_WINDOW event was triggered
	if (minimizeWindow) {
		// Check if the options object exists and if it has a height property
		if (options && options.height) {
			// Override the height property
			options.height = 40; // Set your desired height value here
		}
	}

	console.log('Custom show UI', options);

	if (figma && figma.showUI && typeof figma.showUI === 'function') {
		figma['show' + 'UI'](htmlString, options);
	} else {
		console.warn('Figma showUI method is not available.');
	}
}
