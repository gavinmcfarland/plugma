import App from './App.svelte';
import "./app.css";

// if (!PLUGMA_APP_NAME) {
//   throw new Error('PLUGMA_APP_NAME environment variable is not defined');
// }

const app = new App({
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  target: document.getElementById('figma-bridge')!,
});

export default app;
