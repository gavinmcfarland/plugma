#!/usr/bin/env node

import { execSync } from 'child_process';

const clientTypes = {
	'server': (port) => `concurrently "tsx src/node/websocket-server.ts" "vite --port ${port}"`,
    'vite': (port) => `tsx src/client/vite-client.ts --port ${port}`,
    'test': (port) => `tsx src/client/test-client.ts --port ${port}`,
    'figma': (port) => `open http://localhost:${port}/?type=figma`,
    'browser': (port) => `open http://localhost:${port}/?type=browser`
};

// Parse command line arguments
const args = process.argv.slice(2);
const clientType = args[0];
const portFlagIndex = args.findIndex(arg => arg === '--port' || arg === '-p');
const port = portFlagIndex !== -1
    ? args[portFlagIndex + 1]
    : args[1] || '5173'; // Use second argument if no flag found
console.log('Selected port:', port); // Debug log

if (!clientType || !clientTypes[clientType]) {
    console.error('Please specify a valid client type:');
    console.error('Available types:', Object.keys(clientTypes).join(', '));
    process.exit(1);
}

try {
    execSync(clientTypes[clientType](port), { stdio: 'inherit' });
} catch (error) {
    console.error(`Error running ${clientType}:`, error.message);
    process.exit(1);
}