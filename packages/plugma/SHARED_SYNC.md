# Shared Code Sync

This package uses a "folded shared code" approach where the `@plugma/shared` package code is copied into `src/shared/` to avoid runtime dependencies on workspace packages.

## ✅ Problem Solved

The original issue was that `@plugma/shared` was a workspace-only package that consumers couldn't install from npm. This has been resolved by:

1. **Removed workspace dependencies**: No more `@plugma/shared` or `workspace:*` references in the published package
2. **Folded shared code**: All shared utilities are now bundled directly into the plugma package
3. **Automated syncing**: Changes to shared code are automatically synced during development and publishing

## Automatic Syncing

### Development Mode with Auto-Sync
```bash
npm run dev:shared
```
This runs both:
- File watcher that automatically syncs shared code when changes are detected
- TypeScript compilation in watch mode

### Manual Sync
```bash
npm run sync-shared
```
Manually syncs the shared code from `@plugma/shared` to `src/shared/`

## Publishing

The `prepack` script automatically runs `sync-shared` before publishing, ensuring the published package always has the latest shared code.

## How It Works

1. **Source**: Shared code lives in `/packages/shared/src/`
2. **Sync**: Script copies files to `/packages/plugma/src/shared/`
3. **Build**: TypeScript compiles the folded code into the final package
4. **Publish**: No runtime dependency on `@plugma/shared`

## File Structure After Sync

```
src/shared/
├── index.ts              # Main exports
├── core/
│   ├── types.ts          # Type definitions
│   └── manifest-paths.ts # Manifest utilities
└── utils/
    ├── fs/
    │   └── read-json.ts  # File system utilities
    ├── get-user-files.ts # User file detection
    ├── get-random-port.ts # Port utilities
    ├── create-options.ts # Option creation
    └── package-manager-commands.ts # Package manager utilities
```
