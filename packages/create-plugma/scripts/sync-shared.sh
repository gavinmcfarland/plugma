#!/bin/bash

# Script to sync shared code from @plugma/shared to create-plugma/src/shared
# This ensures that changes to the shared package are automatically reflected in create-plugma

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Syncing shared code from @plugma/shared to create-plugma...${NC}"

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CREATE_PLUGMA_DIR="$(dirname "$SCRIPT_DIR")"
SHARED_DIR="$(dirname "$CREATE_PLUGMA_DIR")/shared"

# Check if shared directory exists
if [ ! -d "$SHARED_DIR/src" ]; then
    echo -e "${RED}❌ Error: Shared directory not found at $SHARED_DIR/src${NC}"
    exit 1
fi

# Create shared directory structure in create-plugma if it doesn't exist
CREATE_PLUGMA_SHARED_DIR="$CREATE_PLUGMA_DIR/src/shared"
mkdir -p "$CREATE_PLUGMA_SHARED_DIR/core"
mkdir -p "$CREATE_PLUGMA_SHARED_DIR/utils/fs"

# Copy shared files
echo -e "${YELLOW}📁 Copying core files...${NC}"
cp "$SHARED_DIR/src/core/"* "$CREATE_PLUGMA_SHARED_DIR/core/" 2>/dev/null || true

echo -e "${YELLOW}📁 Copying utility files...${NC}"
cp "$SHARED_DIR/src/utils/"*.ts "$CREATE_PLUGMA_SHARED_DIR/utils/" 2>/dev/null || true
cp "$SHARED_DIR/src/utils/fs/"* "$CREATE_PLUGMA_SHARED_DIR/utils/fs/" 2>/dev/null || true

# Update the index.ts file
echo -e "${YELLOW}📝 Updating index.ts...${NC}"
cat > "$CREATE_PLUGMA_SHARED_DIR/index.ts" << 'EOF'
// Core types and utilities
export * from './core/types.js';
export * from './core/manifest-paths.js';

// Utility functions
export * from './utils/fs/read-json.js';
export * from './utils/get-user-files.js';
export * from './utils/get-random-port.js';
export * from './utils/create-options.js';
export * from './utils/package-manager-commands.js';
EOF

# Fix the package.json import path in types.ts
echo -e "${YELLOW}🔧 Fixing import paths...${NC}"
if [ -f "$CREATE_PLUGMA_SHARED_DIR/core/types.ts" ]; then
    # Update the package.json import path to point to the correct location
    sed -i.bak 's|../../package.json|../../../package.json|g' "$CREATE_PLUGMA_SHARED_DIR/core/types.ts"
    rm -f "$CREATE_PLUGMA_SHARED_DIR/core/types.ts.bak"
fi

echo -e "${GREEN}✅ Shared code sync completed successfully!${NC}"
echo -e "${GREEN}📦 The create-plugma package now has the latest shared code${NC}"

# Optional: Run a quick build check
echo -e "${YELLOW}🔍 Running quick build check...${NC}"
cd "$CREATE_PLUGMA_DIR"
if npm run build:prod > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build check passed!${NC}"
else
    echo -e "${RED}❌ Build check failed. Please check for any issues.${NC}"
    exit 1
fi
