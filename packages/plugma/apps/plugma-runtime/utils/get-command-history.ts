import type { CommandHistory, PlugmaRuntimeData } from '../../shared/types.js'

declare const runtimeData: PlugmaRuntimeData

/**
 * Retrieves and updates command history from client storage.
 * Used to track previous plugin instances and commands.
 * @returns Promise<CommandHistory> The previous command and instance information
 */
export async function getCommandHistory(): Promise<CommandHistory> {
	let commandHistory = (await figma.clientStorage.getAsync('PLUGMA_COMMAND_HISTORY')) as CommandHistory

	// If there's no history, initialize the commandHistory object
	if (!commandHistory) {
		commandHistory = {
			previousCommand: null,
			previousInstanceId: null,
		}
	}

	// Retrieve the previous command to return first
	const previousCommand = commandHistory.previousCommand
	const previousInstanceId = commandHistory.previousInstanceId

	// Set the current command as the new previous command for future retrievals
	commandHistory.previousCommand = runtimeData.command ?? null
	commandHistory.previousInstanceId = runtimeData.instanceId
	await figma.clientStorage.setAsync('PLUGMA_COMMAND_HISTORY', commandHistory)

	return { previousCommand, previousInstanceId }
}
