const appName = import.meta.env.VITE_APP_NAME;
console.log(`Loading app from path: ${appName}`);

if (!appName) {
  throw new Error("VITE_APP_NAME environment variable is not defined");
}

console.log("----", appName);

import(`./projects/${appName}/App.svelte`)
  .then(({ default: App }) => {
    new App({
      target: document.getElementById(appName)!,
    });
  })
  .catch((err) => {
    console.error(`Failed to load the app: ${appName}`, err);
  });
