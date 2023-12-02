function mount(Component: any) {
	const app = new Component({
		target: document.getElementById("app"), // Replace 'app' with your actual target element's ID
	});
	return app;
}

export { mount };
