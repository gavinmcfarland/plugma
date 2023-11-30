import "./styles/app.css";
import App from "./views/App.svelte";
import DevelopmentWrapper from "./DevelopmentWrapper.svelte";

let app;

if (
	import.meta.env.MODE === "server" ||
	import.meta.env.MODE === "development"
) {
	app = new DevelopmentWrapper({
		target: document.getElementById("app")!,
	});
} else {
	app = new App({
		target: document.getElementById("app")!,
	});
}

export default app;
