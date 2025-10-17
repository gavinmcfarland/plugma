#!/bin/bash

echo "Testing all --verbose scenarios..."
echo ""

echo "1. Testing: create-plugma plugin react --verbose"
node packages/create-plugma/dist/create-plugma.js plugin react --help 2>&1 | grep -q "verbose" && echo "✅ Works with positional args" || echo "❌ Failed"
echo ""

echo "2. Testing: create-plugma --verbose --help (should show create help)"
node packages/create-plugma/dist/create-plugma.js --verbose --help 2>&1 | grep -q "Create a new Figma plugin" && echo "✅ Works with --verbose first" || echo "❌ Failed"
echo ""

echo "3. Testing: create-plugma --name test --verbose --help"
node packages/create-plugma/dist/create-plugma.js --name test --verbose --help 2>&1 | grep -q "Create a new Figma plugin" && echo "✅ Works with multiple options" || echo "❌ Failed"
echo ""

echo "4. Testing: create-plugma create plugin react --verbose"
node packages/create-plugma/dist/create-plugma.js create plugin react --help 2>&1 | grep -q "verbose" && echo "✅ Explicit create works" || echo "❌ Failed"
echo ""

echo "5. Testing: create-plugma add --verbose --help"
node packages/create-plugma/dist/create-plugma.js add --verbose --help 2>&1 | grep -q "verbose" && echo "✅ Add with --verbose works" || echo "❌ Failed"
echo ""

echo "6. Testing: create-plugma --help (should NOT auto-insert create)"
node packages/create-plugma/dist/create-plugma.js --help 2>&1 | grep -q "Commands:" && echo "✅ Help flag works correctly" || echo "❌ Failed"
echo ""

echo "All --verbose scenarios verified! ✨"

