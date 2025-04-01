import { task, run, serial } from "#tasks/runner.js";

// Register tasks and store their names
const devTask = task("dev", async () => {
	console.log("Hello, world!");
});

const exampleTask = "example";

// This will be type-safe
task("build", async () => {
	console.log("Building...");
});

run(async () => {
	// Now returns TaskResults
	const results = await serial([devTask, "build"]); // both should be valid types

	return results;
});
