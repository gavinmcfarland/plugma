import { task, run, serial } from "#tasks/runner.js";

const devTask = task("dev", async () => {
	console.log("Hello, world!");
});

const exampleTask = "example";

task("build", async () => {
	console.log("Building...");
});

run(async (opts: any) => {
	return await serial(["dev"], opts);
});
