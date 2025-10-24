/**
 * Add command - delegates to create-plugma package
 */

import { AddCommandOptions } from '../utils/create-options.js';

/**
 * Delegate to create-plugma package by dynamically importing its add function
 */
export async function add(options: AddCommandOptions): Promise<void> {
	try {
		// Dynamic import of create-plugma
		const { add: addFromPlugma } = await import('create-plugma');

		// Convert plugma options to create-plugma options format
		const addPlugmaOptions = {
			...options,
		};

		// Directly call the add function from create-plugma
		await addFromPlugma(addPlugmaOptions);
	} catch (error) {
		console.error('Error: create-plugma package not found. Please install it separately.');
		console.error('Run: npm install create-plugma');
		process.exit(1);
	}
}
