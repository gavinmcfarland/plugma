/**
 * Add command - delegates to create-plugma package
 */

import { add as addFromPlugma, type AddCommandOptions as AddPlugmaOptions } from 'create-plugma';
import { AddCommandOptions } from '../utils/create-options.js';

/**
 * Delegate to create-plugma package by directly calling its add function
 */
export async function add(options: AddCommandOptions): Promise<void> {
	// Convert plugma options to create-plugma options format
	const addPlugmaOptions: AddPlugmaOptions = {
		...options,
	};

	// Directly call the add function from create-plugma
	await addFromPlugma(addPlugmaOptions);
}
