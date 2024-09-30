#! /usr/bin/env node

import cli from '../scripts/run-script.js';
import { runRelease } from '../scripts/run-release.js';
import _yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const yargs = _yargs(hideBin(process.argv));

yargs.scriptName("plugma")
	.usage('Usage: $0 <cmd> [opts]')
	.version(false);

yargs.command('dev', 'Start a server to develop your plugin', function (yargs) {
	yargs
		.option('p', {
			alias: 'port',
			description: 'Specify a port number for the plugin preview',
			type: 'number'
		})
		.option('t', {
			alias: 'toolbar',
			description: 'Display the developer toolbar within the plugin UI',
			type: 'boolean'
		})
		.option('m', {
			alias: 'mode',
			description: 'Specify the mode',
			type: 'string',
			choices: ['development', 'production', 'test'],
			default: 'development'
		})
		.example(
			"$0 dev --port 3000",
			"Runs a dev server on port 3000"
		)
		.example(
			"$0 dev --mode test",
			"Runs a dev server in test mode"
		)
		.argv;
}).command('build', 'Create a build ready for publishing', function (yargs) {
	yargs
		.option('w', {
			alias: 'watch',
			description: 'Watch for changes and rebuild automatically',
			type: 'boolean'
		})
		.option('m', {
			alias: 'mode',
			description: 'Specify the mode',
			type: 'string',
			choices: ['development', 'production', 'test'],
			default: 'production'
		})
		.example(
			"$0 build --mode production",
			"Creates a build in production mode"
		)
		.argv;
}).command('release [version]', 'Prepare a release for your plugin', function (yargs) {
	yargs
		.positional('version', {
			describe: 'Specify the version type or version number',
			choices: ['alpha', 'beta', 'stable'],
			default: 'stable',
			type: 'string'
		})
		.option('title', {
			alias: 't',
			description: 'Specify a title for the release',
			type: 'string',
			default: ''
		})
		.option('notes', {
			alias: 'n',
			description: 'Specify release notes',
			type: 'string',
			default: ''
		})
		.example(
			"$0 release",
			"Releases the next stable version of the plugin"
		)
		.example(
			"$0 release alpha --title 'Alpha Release' --notes 'Initial alpha release'",
			"Releases an alpha version of the plugin with title and notes"
		)
		.argv;
});

// Call the appropriate function based on the command
if (yargs.argv._[0] === 'release') {
	// Extract version, title, and notes from arguments
	const { version = 'stable', title = '', notes = '' } = yargs.argv;

	// Define valid release types
	const validReleaseTypes = ['alpha', 'beta', 'stable'];

	let releaseOptions = {
		title,
		notes
	};

	// Check if the provided version is a valid release type or a manual version number
	if (validReleaseTypes.includes(version)) {
		// It's a release type like 'alpha', 'beta', or 'stable'
		releaseOptions.type = version;
	} else if (/^\d+$/.test(version)) {
		// It's a whole integer version number (e.g., 27)
		releaseOptions.version = version;
	} else {
		console.error('Invalid version: must be a whole integer or a release type (alpha, beta, stable)');
		process.exit(1);
	}

	// Call runRelease with the appropriate options
	runRelease(releaseOptions);
} else {
	cli(yargs.argv);
}
