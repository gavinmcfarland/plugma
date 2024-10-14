const appName = import.meta.env.VITE_APP_NAME;
// console.log(`Loading app from path: ${appName}`);

if (!appName) {
	throw new Error("VITE_APP_NAME environment variable is not defined");
}

import './app.css'
import App from './App.svelte'

const app = new App({
	target: document.getElementById(appName),
})

export default app
