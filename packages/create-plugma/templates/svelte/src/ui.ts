import "./styles.css";
import Index from "./components/Index.svelte";

const app = new Index({
	target: document.getElementById("app"),
});

export default app;
