tell application "Figma" to activate
delay 0.5
tell application "System Events"
    tell process "Figma"
        keystroke "p" using {command down, option down}
    end tell
end tell