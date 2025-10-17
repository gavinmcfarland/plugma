#!/bin/bash

echo "Testing all command variations..."
echo ""

echo "1. Testing: create-plugma plugin --help (auto-insert create)"
node packages/create-plugma/dist/create-plugma.js plugin --help | grep -q "verbose" && echo "✅ create-plugma plugin --help works" || echo "❌ Failed"
echo ""

echo "2. Testing: create-plugma create --help"
node packages/create-plugma/dist/create-plugma.js create --help | grep -q "verbose" && echo "✅ create-plugma create --help works" || echo "❌ Failed"
echo ""

echo "3. Testing: create-plugma add --help"
node packages/create-plugma/dist/create-plugma.js add --help | grep -q "verbose" && echo "✅ create-plugma add --help works" || echo "❌ Failed"
echo ""

echo "4. Testing: plugma create --help"
node packages/plugma/bin/plugma.js create --help | grep -q "verbose" && echo "✅ plugma create --help works" || echo "❌ Failed"
echo ""

echo "5. Testing: plugma add --help"
node packages/plugma/bin/plugma.js add --help | grep -q "verbose" && echo "✅ plugma add --help works" || echo "❌ Failed"
echo ""

echo "All tests complete!"

