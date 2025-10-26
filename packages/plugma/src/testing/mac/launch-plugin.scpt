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
							click menu item "Plugma Test Sandbox"
							-- I have also tried this using the "set theResult to..." method in the System Events dictionary
							-- set theResult to click menu item "<target menu item>"
						end tell
					end tell
				end tell
			end tell
		end tell
	end tell
end tell