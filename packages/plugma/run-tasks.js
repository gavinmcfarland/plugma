import { promises as fse } from 'fs';
import path from 'path';


import { Task, taskCaller as main } from './task-runner/taskrunner.js';

const CURR_DIR = process.cwd();
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Example usage
const command = 'build'; // or 'preview'

main((task, run) => {
	// Register 'first' task
	task(['build-manifest', 'watch-manifest'], function* (task, options) {
		// Assign multiple aliases to the task
		if (options.watch) {
			task.$.log(`Watching manifest.json`);
		} else {
			task.$.log(`Built manifest.json`);
		}
	});

	task('build-placeholder-ui', function* (task, options) {
		task.$.log(`Built ui.html`);
	});

	task('build-ui', function* (task, options) {
		task.$.log(`Built ui.html`);
	});

	task(['build-main', 'watch-main'], function* (task, options) {
		if (options.watch) {
			task.$.log(`Watching main.js`);
		}
		else {
			task.$.log(`Built main.js`);
		}
	});

	task('start-vite-server', function* (task, options) {
		task.$.log(`Start vite server`);
	});

	// Example of running tasks based on the command
	switch (command) {
		case 'dev':
		case 'preview':
			// Using callback to run tasks serially via task.serial and forwarding options
			run((options) => {
				task.serial([
					'watch-manifest',
					'build-placeholder-ui',
					'watch-main',
					'start-vite-server'
				], options);  // Pass options explicitly
			}, { command, watch: true });
			break;

		// Run a specific task by its name and forward options
		case 'build':
			run((options) => {
				task.serial([
					'build-manifest',
					'build-ui',
					'build-main',
				], options);  // Pass options explicitly
			}, { command, val: 10 });
			break;
	}
});
