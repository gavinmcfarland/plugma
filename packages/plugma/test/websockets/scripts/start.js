#!/usr/bin/env node

import { execSync } from 'child_process';

const clientTypes = {
	'server': "concurrently \"tsx src/node/websocket-server.ts\" \"vite\"",
    'vite': 'tsx src/client/vite-client.ts',
    'test': 'tsx src/client/test-client.ts',
    'figma': 'open http://localhost:5173/?type=figma',
    'browser': 'open http://localhost:5173/?type=browser'
};

const clientType = process.argv[2];

if (!clientType || !clientTypes[clientType]) {
    console.error('Please specify a valid client type:');
    console.error('Available types:', Object.keys(clientTypes).join(', '));
    process.exit(1);
}

try {
    execSync(clientTypes[clientType], { stdio: 'inherit' });
} catch (error) {
    console.error(`Error running ${clientType}:`, error.message);
    process.exit(1);
}