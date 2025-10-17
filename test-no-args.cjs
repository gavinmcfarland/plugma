#!/usr/bin/env node

// Test that create-plugma with no args starts interactive create
const { spawn } = require('child_process');

const child = spawn('node', [
    'packages/create-plugma/dist/create-plugma.js'
], {
    cwd: __dirname,
    stdio: 'pipe'
});

let output = '';
child.stdout.on('data', (data) => {
    output += data.toString();
    // Kill after we see the interactive prompt
    if (output.includes('Choose a type:') || output.includes('Type')) {
        console.log('✅ create-plugma with no args starts interactive create flow!');
        console.log('\nFirst few lines:');
        console.log(output.split('\n').slice(0, 10).join('\n'));
        child.kill();
        process.exit(0);
    }
});

child.stderr.on('data', (data) => {
    output += data.toString();
});

setTimeout(() => {
    if (output.includes('Usage:') && output.includes('Commands:')) {
        console.log('❌ FAILED: create-plugma is showing help instead of starting create');
        console.log(output.split('\n').slice(0, 15).join('\n'));
    } else {
        console.log('Output received:');
        console.log(output.split('\n').slice(0, 20).join('\n'));
    }
    child.kill();
    process.exit(0);
}, 3000);

