# NPM Cache Issue with @next Releases

## Problem

After publishing plugma@next and create-plugma@next, users may encounter errors like:

```
npm error code ETARGET
npm error notarget No matching version found for plugma@2.0.30
```

## Root Cause

This is an npm/npx caching issue. The packages exist on npm and are correctly tagged, but npm has stale metadata cached locally.

## Solution for Users

If users encounter this error, they should:

```bash
# Clear npm cache
npm cache clean --force

# Then retry
npx plugma@next create
```

## Verification

To verify packages are published correctly:

```bash
# Check version and dist-tags
npm view plugma versions dist-tags --json
npm view create-plugma versions dist-tags --json

# Test direct access to specific version
npm view plugma@2.0.30 version
npm view create-plugma@2.0.21 version

# Test dist-tag resolution
npx --yes plugma@next --version
```

## Publishing Workflow Issue (FIXED)

The initial publish had `"create-plugma": "2.0.21"` instead of `"create-plugma": "next"` because pnpm was automatically converting `workspace:*` to exact versions during pack.

**Fix implemented**:

- Moved `prepare-publish.js` to `preversion` hook (runs before version commit)
- Added `postversion` hook to stage changes
- This ensures the version commit contains the correct dependency (`"next"` for @next releases)

## Next Steps

1. Publish a new version to test the fixed lifecycle hooks
2. Verify the published package has `"create-plugma": "next"` (not a version number)
3. Update documentation to mention cache clearing if users encounter issues
