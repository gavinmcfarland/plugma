const appName = import.meta.env.VITE_APP_NAME

if (!appName) {
	throw new Error('VITE_APP_NAME environment variable is not defined')
}

// import(`./src/${appName}/App.svelte`)
// 	.then(({ default: App }) => {
// 		new App({
// 			target: document.getElementById(appName)!,
// 		});
// 	})
// 	.catch((err) => {
// 		console.error(`Failed to load the app: ${appName}`, err);
// 	});

async function loadApp(appName) {
	try {
		const { default: App } = await import(`./src/${appName}/App.svelte`)
		const app = new App({
			target: document.getElementById(appName),
		})
		return app
	} catch (err) {
		console.error(`Failed to load the app: ${appName}`, err)
	}
}

module.exports = { loadApp }
