#!/bin/bash

# Development setup script for Plugma monorepo
# This script sets up the development environment with link: dependencies

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the absolute path of the repo root
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Setting up Plugma development environment..."

# Set versions for development mode
print_status "Setting versions.json files to development mode..."
if [ -f "packages/plugma/scripts/manage-versions.js" ]; then
    node packages/plugma/scripts/manage-versions.js dev
    print_success "Development mode configured successfully!"
else
    print_error "manage-versions.js script not found!"
    exit 1
fi

print_success "Development environment setup complete!"
print_status "You can now run:"
print_status "  - npm run dev (in packages/plugma) to start development"
print_status "  - npm run dev (in packages/create-plugma) to start development"
print_status ""
print_status "When you're ready to publish, run:"
print_status "  - npm run prepublishOnly (in packages/plugma)"
print_status "  - npm run prepublishOnly (in packages/create-plugma)"
