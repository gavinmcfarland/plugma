// Create a no-op version for browser environments
const noop = async () => {
	console.warn("launchPlugin is only available in Node.js environments");
};

export const launchPlugin =
	typeof process !== "undefined" && process.versions?.node
		? async function launchPlugin(
				name: string | undefined,
				switchBack: boolean = false,
			) {
				// Dynamically import Node.js modules
				const { exec } = await import("child_process");
				const { promisify } = await import("util");
				// const { getUserFiles } = await import("#utils");

				// const files = await getUserFiles(options);

				name = name ?? "Plugma Test Sandbox";

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
							click menu item "${name}"
						end tell
					end tell
				end tell
			end tell
		end tell
	end tell
end tell

${
	switchBack
		? `
	-- Switch back to the previously active app
	delay 0.5 -- Small delay to ensure the plugin launches
	tell application activeApp to activate
	`
		: ""
}
`;

				const execPromise = promisify(exec);

				try {
					const { stdout, stderr } = await execPromise(
						"osascript -e '" + scriptLaunchPlugin + "'",
					);

					if (stderr) {
						console.error(`Stderr: ${stderr}`);
						return;
					}

					console.log("Plugin launched successfully.");
					console.log(stdout);
				} catch (error) {
					console.error(
						`Error: ${error instanceof Error ? error.message : String(error)}`,
					);
				}
			}
		: noop;
