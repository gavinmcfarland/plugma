// import Preview from "./Preview.svelte";

function mount(App) {
  let app;

  // if (
  // 	import.meta.env.MODE === "server" ||
  // 	import.meta.env.MODE === "development"
  // ) {
  // 	app = new Preview({
  // 		target: document.getElementById("app")!,
  // 	});
  // } else {
  // 	app = new App({
  // 		target: document.getElementById("app")!,
  // 	});
  // }

  app = new App({
    target: document.getElementById("app")!,
  });

  return app;
}

export { mount };
