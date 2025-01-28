export async function loadApp(appName: string) {
	try {
		const { default: App } = await import(`./${appName}/App.svelte`)

		const app = new App({
			target: document.getElementById(appName),
		})
		return app
	} catch (err) {
		console.error(`Failed to load the app: ${appName}`, err)
	}
}
