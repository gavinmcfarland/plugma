#!/usr/bin/env node

// Test script to verify --no-install flag behavior
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Testing --no-install flag behavior...\n');

// Test 1: --no-install should skip installation
console.log('Test 1: --no-install should skip installation');
const test1 = spawn('node', [
    'packages/create-plugma/dist/create-plugma.js',
    'plugin',
    'react',
    '--no-install',
    '--dir', 'test-no-install-1'
], {
    cwd: __dirname,
    stdio: 'pipe'
});

let test1Output = '';
test1.stdout.on('data', (data) => {
    test1Output += data.toString();
});

test1.stderr.on('data', (data) => {
    test1Output += data.toString();
});

test1.on('close', (code) => {
    console.log('Test 1 completed with code:', code);
    console.log('Output contains "Installing dependencies":', test1Output.includes('Installing dependencies'));
    console.log('Output contains "Skip":', test1Output.includes('Skip'));

    // Clean up
    const testDir = path.join(__dirname, 'test-no-install-1');
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }

    // Test 2: --yes --no-install should skip installation
    console.log('\nTest 2: --yes --no-install should skip installation');
    const test2 = spawn('node', [
        'packages/create-plugma/dist/create-plugma.js',
        'plugin',
        'react',
        '--yes',
        '--no-install',
        '--dir', 'test-no-install-2'
    ], {
        cwd: __dirname,
        stdio: 'pipe'
    });

    let test2Output = '';
    test2.stdout.on('data', (data) => {
        test2Output += data.toString();
    });

    test2.stderr.on('data', (data) => {
        test2Output += data.toString();
    });

    test2.on('close', (code) => {
        console.log('Test 2 completed with code:', code);
        console.log('Output contains "Installing dependencies":', test2Output.includes('Installing dependencies'));
        console.log('Output contains "Skip":', test2Output.includes('Skip'));

        // Clean up
        const testDir2 = path.join(__dirname, 'test-no-install-2');
        if (fs.existsSync(testDir2)) {
            fs.rmSync(testDir2, { recursive: true, force: true });
        }

        console.log('\nTests completed!');
    });
});

// Timeout after 10 seconds
setTimeout(() => {
    console.log('Test timed out');
    test1.kill();
    process.exit(1);
}, 10000);
