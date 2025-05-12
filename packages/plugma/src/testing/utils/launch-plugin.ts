// Create a no-op version for browser environments
const noop = async () => {
	console.warn('launchPlugin is only available in Node.js environments')
}

type LaunchPluginOptions = {
	submenu?: string | null
	returnToEditor?: boolean
}

export const launchPlugin =
	// Don't run in figma
	typeof figma === 'undefined'
		? async function launchPlugin(name: string, { submenu, returnToEditor }: LaunchPluginOptions) {
				let exec: any
				let promisify: any

				try {
					// Only import Node.js modules when needed
					const childProcess = await import('node:child_process')
					const util = await import('node:util')
					exec = childProcess.exec
					promisify = util.promisify
				} catch (error) {
					console.warn('Node.js modules not available in this environment')
					return
				}

				name = name ?? 'Plugma Test Sandbox'
				const scriptLaunchPlugin = `
-- Get the currently active app
tell application "System Events"
	set activeApp to name of first application process whose frontmost is true
end tell

tell application "Figma"
	activate
end tell

tell application "System Events"
	tell process "Figma"
		tell menu bar 1
			tell menu bar item "Plugins"
				tell menu "Plugins"
					tell menu item "Development"
						tell menu "Development"
							${
								submenu
									? `tell menu item "${name}"
									tell menu "${name}"
										click menu item "${submenu}"
									end tell
								end tell`
									: `click menu item "${name}"`
							}
						end tell
					end tell
				end tell
			end tell
		end tell
	end tell
end tell

${
	returnToEditor
		? `
	-- Switch back to the previously active app
	delay 0.5 -- Small delay to ensure the plugin launches
	tell application activeApp to activate
	`
		: ''
}
`
				const execPromise = promisify(exec)

				return new Promise((resolve, reject) => {
					execPromise("osascript -e '" + scriptLaunchPlugin + "'")
						.then(({ stdout, stderr }: { stdout: string; stderr: string }) => {
							if (stderr) {
								console.error(`Stderr: ${stderr}`)
								reject(new Error(stderr))
								return
							}
							console.log('Plugin launched successfully.')
							console.log(stdout)
							resolve(stdout)
						})
						.catch((error: unknown) => {
							console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
							reject(error)
						})
				})
			}
		: noop
