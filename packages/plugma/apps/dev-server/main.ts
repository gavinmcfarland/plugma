import App from './App.svelte';
import { mount } from "svelte";

// if (!PLUGMA_APP_NAME) {
//   throw new Error('PLUGMA_APP_NAME environment variable is not defined');
// }

const app = mount(App, {
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  target: document.getElementById('dev-server')!,
});

export default app;
