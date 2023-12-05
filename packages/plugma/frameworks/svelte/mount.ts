import PreviewWrapper from "./previewWrapper.svelte";

function mount(App) {
	let app;

	if (
		import.meta.env.MODE === "server" ||
		import.meta.env.MODE === "development"
	) {
		app = new PreviewWrapper({
			target: document.getElementById("app")!,
		});
	} else {
		app = new App({
			target: document.getElementById("app")!,
		});
	}
	return app;
}

export { mount };
