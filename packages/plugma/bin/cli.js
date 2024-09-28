#! /usr/bin/env node

import cli from '../scripts/run-script.js';
import { runRelease } from '../scripts/run-release.js';
import _yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const yargs = _yargs(hideBin(process.argv));

yargs.scriptName("plugma")
	.usage('Usage: $0 <cmd> [opts]')
	.version(false)

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
}).command('release', 'Prepare a release for your plugin', function (yargs) {
	yargs
		.version(false)
		.option('v', {
			alias: 'version',
			description: 'Specify the version',
			choices: ['alpha', 'beta', 'stable', '<integer>'],
			type: 'string', // Now accepting both string and number as a string
		})
		.example(
			"$0 release",
			"Releases the next stable version of the plugin"
		)
		.example(
			"$0 release --version alpha",
			"Releases an alpha version of the plugin"
		)
		.example(
			"$0 release --version 27",
			"Manually sets the plugin version to 27"
		)
		.argv;
});

// Call the appropriate function based on the command
if (yargs.argv._[0] === 'release') {
	// Extract version or set to 'stable' by default
	const { version = 'stable' } = yargs.argv;

	// Define valid release types
	const validReleaseTypes = ['alpha', 'beta', 'stable'];

	let releaseOptions = {};

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
