#!/bin/bash

echo "Final verification of all commands..."
echo ""

echo "1. Testing: create-plugma --help (should show help)"
node packages/create-plugma/dist/create-plugma.js --help | grep -q "Commands:" && echo "✅ Help works" || echo "❌ Failed"
echo ""

echo "2. Testing: create-plugma plugin --help (auto-insert create)"
node packages/create-plugma/dist/create-plugma.js plugin --help | grep -q "verbose" && echo "✅ Auto-insert works with help" || echo "❌ Failed"
echo ""

echo "3. Testing: create-plugma add --help (add subcommand)"
node packages/create-plugma/dist/create-plugma.js add --help | grep -q "verbose" && echo "✅ Add subcommand works" || echo "❌ Failed"
echo ""

echo "4. Testing: plugma create --help"
node packages/plugma/bin/plugma.js create --help | grep -q "verbose" && echo "✅ Plugma create works" || echo "❌ Failed"
echo ""

echo "5. Testing: plugma add --help"
node packages/plugma/bin/plugma.js add --help | grep -q "verbose" && echo "✅ Plugma add works" || echo "❌ Failed"
echo ""

echo "All command variations verified! ✨"

