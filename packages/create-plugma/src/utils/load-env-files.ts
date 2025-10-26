import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export function loadEnvFiles() {
	const __dirname = dirname(fileURLToPath(import.meta.url));
	const packageRoot = resolve(__dirname, '..', '..');
	const envPath = resolve(packageRoot, '.env');

	if (!existsSync(envPath)) return;

	const lines = readFileSync(envPath, 'utf-8').split(/\r?\n/);
	for (const line of lines) {
		if (!line || line.startsWith('#')) continue;
		const [key, ...valueParts] = line.split('=');
		const value = valueParts
			.join('=')
			.trim()
			.replace(/^['"]|['"]$/g, '');
		if (key && !(key in process.env)) {
			process.env[key.trim()] = value;
		}
	}
}
