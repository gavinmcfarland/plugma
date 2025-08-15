#!/bin/bash

# Build script for all packages in the Plugma monorepo
# This script builds packages in the correct dependency order

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

# Function to check if a package has a build script
has_build_script() {
    local package_dir="$1"
    if [ -f "$package_dir/package.json" ]; then
        grep -q '"build"' "$package_dir/package.json" 2>/dev/null
    else
        return 1
    fi
}

# Function to build a package
build_package() {
    local package_name="$1"
    local package_dir="$2"

    print_status "Building $package_name..."

    if ! has_build_script "$package_dir"; then
        print_warning "No build script found for $package_name, skipping"
        return 0
    fi

    cd "$package_dir"

    # Use the same package manager as defined in root package.json
    if command -v pnpm >/dev/null 2>&1; then
        pnpm run build
    elif command -v yarn >/dev/null 2>&1; then
        yarn build
    else
        npm run build
    fi

    print_success "$package_name built successfully"
    cd "$REPO_ROOT"
}

# Function to clean all packages
clean_all() {
    print_status "Cleaning all packages..."

    # Clean root
    if [ -d "dist" ]; then
        rm -rf dist
    fi

    # Clean each package
    for package_dir in packages/*/; do
        if [ -d "$package_dir" ]; then
            cd "$package_dir"
            if [ -d "dist" ]; then
                rm -rf dist
            fi
            cd "$REPO_ROOT"
        fi
    done

    print_success "All packages cleaned"
}

# Main build function
main() {
    local start_time=$(date +%s)

    print_status "Starting build process for all packages..."
    print_status "Repository root: $REPO_ROOT"

    # Parse command line arguments
    local clean_first=false
    local watch_mode=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean)
                clean_first=true
                shift
                ;;
            --watch)
                watch_mode=true
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --clean    Clean all packages before building"
                echo "  --watch    Build in watch mode (where supported)"
                echo "  -h, --help Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Clean if requested
    if [ "$clean_first" = true ]; then
        clean_all
    fi

    # Build packages in dependency order
    # 1. create-plugma (no dependencies on other packages)
    if [ -d "packages/create-plugma" ]; then
        build_package "create-plugma" "packages/create-plugma"
    fi

    # 2. plugma (the main CLI package)
    if [ -d "packages/plugma" ]; then
        build_package "plugma" "packages/plugma"
    fi

    # 3. website (may depend on other packages for documentation)
    if [ -d "packages/website" ]; then
        build_package "website" "packages/website"
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    print_success "All packages built successfully in ${duration}s!"

    # Show build artifacts
    print_status "Build artifacts:"
    for package_dir in packages/*/; do
        if [ -d "$package_dir/dist" ]; then
            package_name=$(basename "$package_dir")
            echo "  📦 $package_name: $package_dir/dist"
        fi
    done
}

# Trap to handle script interruption
trap 'print_error "Build interrupted"; exit 1' INT TERM

# Run main function with all arguments
main "$@"
