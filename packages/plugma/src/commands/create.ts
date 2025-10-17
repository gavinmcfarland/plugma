/**
 * Create command - delegates to create-plugma package
 */

import { create as createFromPlugma, type CreateCommandOptions as CreatePlugmaOptions } from 'create-plugma';
import { CreateCommandOptions } from '../utils/create-options.js';

/**
 * Delegate to create-plugma package by directly calling its create function
 */
export async function create(options: CreateCommandOptions): Promise<void> {
	// Convert plugma options to create-plugma options format
	const createPlugmaOptions: CreatePlugmaOptions = {
		...options,
		// Skip showing prompt in create-plugma since plugma already showed it
		skipPrompt: true,
	};

	// Directly call the create function from create-plugma
	await createFromPlugma(createPlugmaOptions);
}
