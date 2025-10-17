#!/usr/bin/env node

// Test that create-plugma --verbose works
const { spawn } = require('child_process');

const child = spawn('node', [
    'packages/create-plugma/dist/create-plugma.js',
    '--verbose'
], {
    cwd: __dirname,
    stdio: 'pipe'
});

let output = '';
child.stdout.on('data', (data) => {
    output += data.toString();
    // Kill after we see some output
    if (output.length > 100) {
        console.log('Output received:');
        console.log(output.split('\n').slice(0, 15).join('\n'));
        child.kill();
        process.exit(0);
    }
});

child.stderr.on('data', (data) => {
    output += data.toString();
});

setTimeout(() => {
    console.log('Final output:');
    console.log(output.split('\n').slice(0, 15).join('\n'));
    child.kill();
    process.exit(0);
}, 3000);

