import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

export function loadEnvFiles() {
	// Get the package root directory
	const __dirname = dirname(fileURLToPath(import.meta.url))
	const packageRoot = resolve(__dirname, '..', '..')

	// Load environment variables from .env files
	config({
		path: resolve(packageRoot, '.env'),
	})

	// // Load environment variables from .env.local if it exists
	// config({
	// 	path: resolve(packageRoot, '.env.local'),
	// 	override: true,
	// })

	// // Load environment variables from .env.{NODE_ENV} if it exists
	// if (process.env.NODE_ENV) {
	// 	config({
	// 		path: resolve(packageRoot, `.env.${process.env.NODE_ENV}`),
	// 		override: true,
	// 	})
	// }
}
