#!/usr/bin/env node

import cli from '../scripts/run-script.js';
import { runRelease } from '../scripts/run-release.js';
import _yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const yargs = _yargs(hideBin(process.argv));

yargs.scriptName("plugma")
	.usage('Usage: $0 <cmd> [opts]')
	.version(false);

const debugOption = {
	alias: 'd',
	description: 'Enable debug mode',
	type: 'boolean',
	default: false,
};

// Handle global debug logging
const handleDebug = (argv) => {
	if (argv.debug) {
		console.log('Debug mode enabled');
		console.log('Command:', argv._);
		console.log('Arguments:', argv);
	}
};

yargs.command('dev', 'Start a server to develop your plugin', function (yargs) {
	yargs
		.option('port', {
			alias: 'p',
			description: 'Specify a port number for the plugin preview',
			type: 'number'
		})
		.option('toolbar', {
			alias: 't',
			description: 'Display the developer toolbar within the plugin UI',
			type: 'boolean'
		})
		.option('mode', {
			alias: 'm',
			description: 'Specify the mode',
			type: 'string',
			choices: ['development', 'production', 'test'],
			default: 'development'
		})
		.option('websockets', {
			alias: 'ws',
			description: 'Enable websockets',
			type: 'boolean',
			default: false
		})
		.option('debug', debugOption)
		.example(
			"$0 dev --port 3000 --websockets",
			"Runs a dev server on port 3000 with websockets enabled"
		)
		.example(
			"$0 dev --mode test",
			"Runs a dev server in test mode"
		)
		.argv;
}).command('preview', 'Preview your plugin', function (yargs) {
	yargs
		.option('port', {
			alias: 'p',
			description: 'Specify a port number for the plugin preview',
			type: 'number'
		})
		.option('toolbar', {
			alias: 't',
			description: 'Display the developer toolbar within the plugin UI',
			type: 'boolean'
		})
		.option('mode', {
			alias: 'm',
			description: 'Specify the mode',
			type: 'string',
			choices: ['development', 'production', 'test'],
			default: 'development'
		})
		.option('websockets', {
			alias: 'ws',
			description: 'Enable websockets',
			type: 'boolean',
			default: true
		})
		.option('debug', debugOption)
		.example(
			"$0 preview --port 3000",
			"Previews the plugin on port 3000 with websockets enabled by default"
		)
		.example(
			"$0 preview --mode production --no-websockets",
			"Previews the plugin in production mode without websockets"
		)
		.argv;
}).command('build', 'Create a build ready for publishing', function (yargs) {
	yargs
		.option('watch', {
			alias: 'w',
			description: 'Watch for changes and rebuild automatically',
			type: 'boolean'
		})
		.option('mode', {
			alias: 'm',
			description: 'Specify the mode',
			type: 'string',
			choices: ['development', 'production', 'test'],
			default: 'production'
		})
		.option('debug', debugOption)
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
		.option('debug', debugOption)
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
	const { version = 'stable', title = '', notes = '', debug = false } = yargs.argv;

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

	// Handle debug mode
	handleDebug(yargs.argv);
} else {
	cli(yargs.argv);

	// Handle debug mode for other commands
	handleDebug(yargs.argv);
}
