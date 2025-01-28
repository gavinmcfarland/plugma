if (!PLUGMA_APP_NAME) {
	throw new Error("PLUGMA_APP_NAME environment variable is not defined");
}

import './app.css';
import App from './App.svelte';

const app = new App({
	target: document.getElementById(PLUGMA_APP_NAME),
})

export default app
