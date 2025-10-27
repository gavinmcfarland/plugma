# Fix for manifest.ts Not Triggering Rebuilds

## Issue

When users use a `manifest.ts` file and make edits, the changes are detected but don't output a new `dist/manifest.json` file. This works fine for `manifest.json` files.

## Root Cause

The issue was in the `readModule` function in `packages/shared/src/utils/fs/read-json.ts`. The function was using a require() cache that didn't properly clear the cache for TypeScript modules. When chokidar detected a change to `manifest.ts`, it would trigger the manifest watcher which would call `buildManifestFile`, which would call `readModule` to reload the manifest. However, the module cache wasn't being fully cleared, so the old manifest data was being returned.

## Solution

Modified the `readModule` function to clear ALL cached modules instead of trying to selectively clear specific ones. This ensures that when a TypeScript manifest file changes, the next read will get the fresh data.

### Changes Made

- In `packages/shared/src/utils/fs/read-json.ts`, changed the cache clearing logic to clear all cached modules:
    - Changed from: `delete require.cache[resolvedPath]` (selective clearing)
    - Changed to: `for (const key in require.cache) { delete require.cache[key]; }` (clear all)

This ensures that every time `readModule` is called, it will get the latest version of the module, regardless of whether it's a TypeScript file or JavaScript file.

## Important: Sync Changes

After making this change, you need to sync the shared code to the plugma and create-plugma packages:

```bash
# From the repo root
bash ./packages/plugma/scripts/sync-shared.sh
bash ./packages/create-plugma/scripts/sync-shared.sh
```

Then rebuild the project:

```bash
npm run build
```

## Testing

To test this fix:

1. Create a project with a `manifest.ts` file
2. Run `plugma dev`
3. Make a change to the manifest.ts file
4. Verify that `dist/manifest.json` is updated with the new values
