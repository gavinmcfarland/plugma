#!/usr/bin/env node

// Test that create-plugma plugin --verbose works (auto-insert create)
const { spawn } = require('child_process');

const child = spawn('node', [
    'packages/create-plugma/dist/create-plugma.js',
    'plugin',
    'react',
    '--verbose',
    '--no-install'
], {
    cwd: __dirname,
    stdio: 'pipe'
});

let output = '';
child.stdout.on('data', (data) => {
    output += data.toString();
    // Kill after we see enough output
    if (output.includes('verbose') || output.includes('Choose')) {
        console.log('✅ Auto-inserted create command works!');
        console.log('First 15 lines of output:');
        console.log(output.split('\n').slice(0, 15).join('\n'));
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

