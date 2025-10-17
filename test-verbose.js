#!/usr/bin/env node

// Test script to check if verbose flag is working
const { spawn } = require('child_process');

const child = spawn('node', [
    'packages/create-plugma/dist/create-plugma.js',
    'add',
    '--verbose'
], {
    cwd: __dirname,
    stdio: 'pipe'
});

let output = '';
child.stdout.on('data', (data) => {
    output += data.toString();
    // Kill after we see the debug output
    if (output.includes('DEBUG: options')) {
        const lines = output.split('\n').slice(0, 15);
        console.log(lines.join('\n'));
        child.kill();
        process.exit(0);
    }
});

child.stderr.on('data', (data) => {
    output += data.toString();
});

setTimeout(() => {
    console.log(output.split('\n').slice(0, 15).join('\n'));
    child.kill();
    process.exit(0);
}, 3000);

