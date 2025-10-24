/**
 * Create command - delegates to create-plugma package
 */

import { CreateCommandOptions } from '../utils/create-options.js';

/**
 * Delegate to create-plugma package by dynamically importing its create function
 */
export async function create(options: CreateCommandOptions): Promise<void> {
	try {
		// Dynamic import of create-plugma
		const { create: createFromPlugma } = await import('create-plugma');

		// Convert plugma options to create-plugma options format
		const createPlugmaOptions = {
			...options,
		};

		// Directly call the create function from create-plugma
		await createFromPlugma(createPlugmaOptions);
	} catch (error) {
		console.error('Error: create-plugma package not found. Please install it separately.');
		console.error('Run: npm install create-plugma');
		process.exit(1);
	}
}
