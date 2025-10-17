#!/usr/bin/env node

// Test script to check if plugma add --verbose works
const { spawn } = require('child_process');

const child = spawn('node', [
    'packages/plugma/bin/plugma.js',
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
    if (output.includes('DEBUG:')) {
        const lines = output.split('\n').slice(0, 20);
        console.log(lines.join('\n'));
        child.kill();
        process.exit(0);
    }
});

child.stderr.on('data', (data) => {
    output += data.toString();
});

setTimeout(() => {
    console.log(output.split('\n').slice(0, 20).join('\n'));
    child.kill();
    process.exit(0);
}, 3000);

