# Build Documentation

This repository includes a comprehensive build script that builds all packages in the correct dependency order.

## Quick Start

```bash
# Build all packages
pnpm run build

# Or run the script directly
./build.sh
```

## Available Commands

### Root Package Scripts

- `pnpm run build` - Build all packages
- `pnpm run build:clean` - Clean and build all packages
- `pnpm run clean` - Clean all build artifacts

### Build Script Options

```bash
# Build all packages
./build.sh

# Clean before building
./build.sh --clean

# Show help
./build.sh --help
```

## Build Order

The script builds packages in dependency order:

1. **create-plugma** - Package creation tool (no dependencies)
2. **plugma** - Main CLI package (complex build with apps)
3. **website** - Documentation website (SvelteKit)

## Package-Specific Builds

Each package has its own build process:

### create-plugma

```bash
cd packages/create-plugma
pnpm run build  # TypeScript compilation
```

### plugma

```bash
cd packages/plugma
pnpm run build  # Complex multi-step build:
                # 1. Clean dist and apps/dist
                # 2. Build all apps (dev-server, figma-bridge, runtime)
                # 3. Build main TypeScript code
```

### website

```bash
cd packages/website
pnpm run build  # SvelteKit static build
```

## Build Artifacts

After building, you'll find:

- `packages/create-plugma/dist/` - Compiled create-plugma tool
- `packages/plugma/dist/` - Main CLI distribution
- `packages/plugma/apps/dist/` - Built applications
- `packages/website/build/` - Static website build

## Troubleshooting

### Build Failures

If a package fails to build:

1. Check if you have all dependencies installed: `pnpm install`
2. Try cleaning first: `./build.sh --clean`
3. Build individual packages to isolate issues

### Missing Dependencies

Ensure you have the required tools:

- Node.js >= 20.17.0
- pnpm >= 9.10.0

### Package Manager Detection

The script automatically detects and uses:

1. pnpm (preferred, as specified in package.json)
2. yarn (fallback)
3. npm (fallback)

## Development Workflow

For development, you might prefer individual package dev commands:

```bash
# Watch mode for plugma
cd packages/plugma
pnpm run dev

# Watch mode for website
cd packages/website
pnpm run dev
```

## CI/CD Integration

The build script is designed for CI environments:

- Exits with non-zero code on failure
- Provides colored output (can be disabled in CI)
- Shows build timing and artifacts
- Supports clean builds for reproducible results
