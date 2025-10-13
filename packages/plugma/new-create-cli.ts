#!/usr/bin/env node
import {
	ask,
	group,
	text,
	confirm,
	radio,
	multi,
	tasks,
	note,
	spinner,
	completedFields,
	type Task,
} from "askeroo";

// Sleep helper function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const flow = async () => {
	await note("[ Plugma ]{bgMagenta} [v2.1.0]{dim}");

	await completedFields();

	const answers = await group(
		async () => {
			// Collect prompts individually
			const path = await text({
				shortLabel: "Path",
				label: "Where should it be created?",
				initialValue: "./my-plugin",
				onValidate: async (value) => {
					if (!value.trim()) return "Path cannot be empty";
					if (value.includes("..")) return "Path cannot contain '..'";
					if (value === "." || value === "./" || value === "/")
						return "Please specify a folder name, not the root directory";
					if (value.includes("//"))
						return "Invalid path: double slashes not allowed";
					if (value.endsWith("/"))
						return "Path cannot end with a slash";

					// Check if the base directory exists (parent path for nested paths)
					try {
						const fs = await import("fs");
						const path = await import("path");
						const resolvedPath = path.resolve(value);
						const parentPath = path.dirname(resolvedPath);
						const stats = await fs.promises.stat(parentPath);
						if (!stats.isDirectory()) {
							return "Base directory does not exist";
						}
					} catch (error) {
						return "Base directory does not exist or is not accessible";
					}

					return null;
				},
			});

			const type = await radio({
				label: "Choose a type:",
				shortLabel: "Type",
				options: [
					{ value: "plugin", label: "Plugin" },
					{ value: "widget", label: "Widget" },
				],
			});

			const framework = await radio({
				label: "Select a framework:",
				shortLabel: "Framework",
				options: [
					{ value: "react", label: "React", color: "red" },
					{ value: "vue", label: "Vue", color: "green" },
					{ value: "svelte", label: "Svelte", color: "yellow" },
					{ value: "no-ui", label: "No UI" },
				],
			});

			const template = await radio({
				shortLabel: "Template",
				label: "Choose a template:",
				hintPosition: "inline-fixed",
				options: [
					{
						value: "default",
						label: "Default",
						hint: "A basic template to get you started",
					},
					{
						value: "minimal",
						label: "Rectangle creator",
						hint: "A minimal template to create rectangles",
					},
				],
			});

			const addons = await multi({
				shortLabel: "Addons",
				label: "Choose addons:",
				hintPosition: "inline-fixed",
				options: [
					{
						value: "tailwind",
						label: "Tailwind",
						hint: "A utility-first CSS framework",
					},
					{
						value: "shadcn",
						label: "Shadcn",
						hint: "A library of components for building websites",
					},
					{
						value: "eslint",
						label: "ESLint",
					},
					{
						value: "prettier",
						label: "Prettier",
						hint: "A formatter for JavaScript",
					},
					{
						value: "vitest",
						label: "Vitest",
						hint: "A testing framework for JavaScript",
					},
					{
						value: "playwright",
						label: "Playwright",
						hint: "A testing framework for JavaScript",
					},
				],
				noneOption: { label: "None" },
			});

			// Conditionally prompt for shadcn config immediately after addons
			let shadcnConfig;
			if (addons.includes("shadcn")) {
				await group(
					async () => {
						shadcnConfig = await radio({
							label: "Choose a style",
							shortLabel: "Style",
							options: [
								{ value: "default", label: "Default" },
								{ value: "shadcn-grape", label: "New York" },
							],
							meta: {
								depth: 1,
								group: "Shadcn",
							},
						});

						shadcnConfig = await radio({
							label: "Choose a color",
							shortLabel: "Color",
							options: [
								{ value: "default", label: "Slate" },
								{ value: "shadcn-zinc", label: "Zinc" },
								{ value: "shadcn-neutral", label: "Neutral" },
								{ value: "shadcn-gray", label: "Gray" },
							],
							meta: {
								depth: 1,
								group: "Shadcn",
							},
						});
					},
					{
						label: "Shadcn",
						flow: "phased",
					}
				);
			}

			const typescript = await confirm({
				shortLabel: "TypeScript",
				label: "Use TypeScript?",
				initialValue: true,
			});

			// Build the final answers object
			const answers = {
				path,
				type,
				framework,
				template,
				addons,
				typescript,
			};

			return answers;
		},
		{ flow: "phased", hideOnCompletion: true }
	);

	// Example of sequential execution using the new API with completeOn setting
	const tasksList: Task[] = [
		{
			label: `Creating ${answers.type} from template`,
			action: async () => {
				await sleep(1000);
			},
		},
	];

	// Add the add-ons task if there are any addons selected
	if (answers.addons.length > 0) {
		tasksList.push({
			label: `Integrating chosen add-ons`,
			action: async () => {
				await sleep(1000);
			},
			concurrent: true,
			tasks: answers.addons.map((addon: string) => ({
				label: `${addon}`,
				action: async () => {
					await sleep(Math.random() * 4000 + 1000);
				},
			})),
		});
	}

	const tasksResult = await tasks(tasksList, {
		concurrent: false,
	});

	const pkgManager = await radio({
		label: "Install dependencies?",
		shortLabel: "Dependencies",
		initialValue: "npm",
		options: [
			{ value: "skip", label: "Skip" },
			{ value: "npm", label: "npm" },
			{ value: "pnpm", label: "pnpm" },
			{ value: "yarn", label: "yarn" },
			{ value: "bun", label: "bun" },
			{ value: "deno", label: "deno" },
		],
		hideOnCompletion: true,
		// allowBack: false,
	});

	if (pkgManager !== "skip") {
		await tasks.add([
			{
				label: `Installing dependencies with ${pkgManager}`,
				action: async () => {
					await sleep(3000); // This will also run in background
				},
			},
		]);
	}

	await note(`**Plugged in and ready to go!**

		1. \`cd ./my-plugin\`
		2. \`npm run dev\`
		3. Import \`dist/manifest.json\` in Figma

		Check the docs out at https://plugma.dev.

		`);

	return { answers, pkgManager };
};

(async () => {
	try {
		const result = await ask(flow, {
			onCancel: async ({ results, cleanup }) => {
				const cancel = await spinner("Canceling...", {
					color: "yellow",
					hideOnCompletion: true,
				});

				await cancel.start();
				await sleep(800);
				await cancel.stop("Cancelled");
				// cleanup(); // Clean up UI first
				// console.log("Results:", results);
				process.exit(0); // User controls exit
			},
		});

		// console.log("\nResult:", JSON.stringify(result, null, 2));
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
})();
