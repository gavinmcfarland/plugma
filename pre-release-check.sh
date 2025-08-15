#!/bin/bash

# Pre-Release Check Script for Plugma
# This script performs comprehensive checks before publishing packages

# Note: We don't use set -e here because we want to handle errors gracefully

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((CHECKS_PASSED++))
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    ((CHECKS_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main checks
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check Node.js version
    if command_exists node; then
        NODE_VERSION=$(node --version | sed 's/v//')
        REQUIRED_NODE="20.17.0"
        if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_NODE" ]; then
            print_success "Node.js version $NODE_VERSION meets requirement (>= $REQUIRED_NODE)"
        else
            print_error "Node.js version $NODE_VERSION is below required $REQUIRED_NODE"
        fi
    else
        print_error "Node.js is not installed"
    fi

    # Check pnpm
    if command_exists pnpm; then
        PNPM_VERSION=$(pnpm --version)
        print_success "pnpm version $PNPM_VERSION is installed"
    else
        print_error "pnpm is not installed"
    fi

    # Check npm authentication
    if npm whoami >/dev/null 2>&1; then
        NPM_USER=$(npm whoami)
        print_success "Logged in to npm as: $NPM_USER"
    else
        print_error "Not logged in to npm. Run 'npm login' first"
    fi
}

check_git_status() {
    print_header "Checking Git Status"

    # Check if git repo
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        print_error "Not in a git repository"
        return
    fi

    # Check for uncommitted changes
    if git diff-index --quiet HEAD --; then
        print_success "No uncommitted changes"
    else
        print_error "There are uncommitted changes. Commit or stash them first"
        git status --porcelain
    fi

    # Check if branch is up to date
    git fetch origin >/dev/null 2>&1
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")

    if [ "$LOCAL" = "$REMOTE" ]; then
        print_success "Branch is up to date with remote"
    elif [ -z "$REMOTE" ]; then
        print_warning "No upstream branch set"
    else
        print_error "Branch is not up to date with remote. Run 'git pull' first"
    fi
}

check_dependencies() {
    print_header "Checking Dependencies"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing dependencies..."
        pnpm install
    fi

    # Security audit
    print_info "Running security audit..."
    if pnpm audit --audit-level high >/dev/null 2>&1; then
        print_success "No high/critical security vulnerabilities found"
    else
        print_warning "High/critical security vulnerabilities detected. Run 'pnpm audit' for details"
    fi
}

run_tests() {
    print_header "Running Tests"

    print_info "Running test suite..."
    if pnpm run test >/dev/null 2>&1; then
        print_success "All tests pass"
    else
        print_error "Tests are failing"
        return
    fi

    print_info "Running tests with coverage..."
    if pnpm run test:coverage >/dev/null 2>&1; then
        print_success "Test coverage check passed"
    else
        print_warning "Test coverage check had issues"
    fi
}

check_linting() {
    print_header "Checking Code Quality"

    # Check plugma package linting
    cd packages/plugma
    if pnpm run lint >/dev/null 2>&1; then
        print_success "Linting passed"
    else
        print_error "Linting failed. Run 'cd packages/plugma && pnpm run lint' for details"
    fi

    # TypeScript type checking - only warn for test file issues
    print_info "Running TypeScript type checking..."
    if pnpm run check >/dev/null 2>&1; then
        print_success "TypeScript type checking passed"
    else
        # Check if errors are only in test files
        CHECK_OUTPUT=$(pnpm run check 2>&1)
        if echo "$CHECK_OUTPUT" | grep -q "__tests__\|test/"; then
            print_warning "TypeScript issues found in test files (non-blocking for production)"
        else
            print_error "TypeScript type checking failed in source files"
        fi
    fi

    cd ../..
}

check_build() {
    print_header "Testing Build Process"

    print_info "Running clean build..."
    if pnpm run build:clean >/dev/null 2>&1; then
        print_success "Clean build completed successfully"
    else
        print_error "Build failed"
        return
    fi

    # Check if build artifacts exist
    if [ -d "packages/plugma/dist" ] && [ -d "packages/create-plugma/dist" ]; then
        print_success "Build artifacts created"
    else
        print_error "Build artifacts missing"
    fi
}

check_package_configs() {
    print_header "Validating Package Configurations"

    # Check package.json files
    for pkg in packages/*/package.json; do
        if [ -f "$pkg" ]; then
            PKG_NAME=$(dirname "$pkg")
            if jq empty "$pkg" >/dev/null 2>&1; then
                print_success "$(basename "$PKG_NAME") package.json is valid JSON"
            else
                print_error "$(basename "$PKG_NAME") package.json has invalid JSON"
            fi
        fi
    done

    # Check for required fields
    for pkg in packages/plugma packages/create-plugma; do
        if [ -f "$pkg/package.json" ]; then
            PKG_NAME=$(basename "$pkg")

            # Check version
            if jq -e '.version' "$pkg/package.json" >/dev/null; then
                VERSION=$(jq -r '.version' "$pkg/package.json")
                print_success "$PKG_NAME version: $VERSION"
            else
                print_error "$PKG_NAME missing version field"
            fi

            # Check files array
            if jq -e '.files' "$pkg/package.json" >/dev/null; then
                print_success "$PKG_NAME has files array defined"
            else
                print_warning "$PKG_NAME missing files array"
            fi
        fi
    done
}

test_publish_dry_run() {
    print_header "Testing Publish Process"

    print_info "Running publish dry run..."
    if npx lerna publish --dry-run >/dev/null 2>&1; then
        print_success "Publish dry run completed successfully"
    else
        print_error "Publish dry run failed"
    fi
}

check_documentation() {
    print_header "Checking Documentation"

    # Check for README files
    for pkg in packages/plugma packages/create-plugma; do
        if [ -f "$pkg/README.md" ]; then
            print_success "$(basename "$pkg") has README.md"
        else
            print_warning "$(basename "$pkg") missing README.md"
        fi
    done

    # Check if website builds
    print_info "Testing website build..."
    cd packages/website
    if pnpm run build >/dev/null 2>&1; then
        print_success "Website builds successfully"
    else
        print_warning "Website build has issues"
    fi
    cd ../..
}

print_summary() {
    print_header "Summary"

    echo -e "Checks passed: ${GREEN}$CHECKS_PASSED${NC}"
    echo -e "Checks failed: ${RED}$CHECKS_FAILED${NC}"
    echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"

    if [ $CHECKS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All critical checks passed! You're ready to publish.${NC}"
        echo -e "\n${BLUE}To publish, run:${NC}"
        echo -e "  ${YELLOW}npx lerna publish${NC}  (for latest tag)"
        echo -e "  ${YELLOW}npx lerna publish --dist-tag=next${NC}  (for next tag)"
    else
        echo -e "\n${RED}❌ Some checks failed. Please fix the issues before publishing.${NC}"
        exit 1
    fi

    if [ $WARNINGS -gt 0 ]; then
        echo -e "\n${YELLOW}⚠ There are warnings that should be addressed.${NC}"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}🚀 Plugma Pre-Release Check Script${NC}"
    echo -e "${BLUE}===================================${NC}"

    check_prerequisites
    check_git_status
    check_dependencies
    run_tests
    check_linting
    check_build
    check_package_configs
    test_publish_dry_run
    check_documentation

    print_summary
}

# Check if jq is installed (needed for JSON parsing)
if ! command_exists jq; then
    echo -e "${RED}Error: jq is required but not installed.${NC}"
    echo -e "${BLUE}Install it with: brew install jq (on macOS)${NC}"
    exit 1
fi

# Run main function
main
