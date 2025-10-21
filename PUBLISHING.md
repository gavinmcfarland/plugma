# Publishing

This repository uses Lerna for managing and publishing packages. Follow these steps to publish packages:

## Prerequisites

- Node.js >= 20.17.0
- pnpm >= 9.10.0
- Lerna (installed as a dev dependency)

## Publishing Steps

1. **Prepare for Publishing**
    - Ensure all changes are committed to the repository
    - Make sure you have the necessary permissions to publish to npm
    - Verify you're logged in to npm (`npm whoami`)

2. **Publish the Packages**

    By default, Lerna will publish all packages with the `latest` tag.

    ```bash
    pnpm run publish
    # or directly:
    npx lerna publish
    ```

    **Or Publish With a Tag**

    For pre-release versions (e.g., alpha, beta, next), use the dist-tag option:

    ```bash
    pnpm run publish:next
    # or directly with environment variable:
    DIST_TAG=next npx lerna publish --dist-tag=next
    ```

    **Important:** When publishing with a dist-tag, make sure to:
    - Set the `DIST_TAG` environment variable to match the dist-tag (e.g., `DIST_TAG=next`)
    - Or publish from the appropriate branch (e.g., `next`, `develop`) which will auto-detect the tag

3. **Version Selection**
    - Lerna will prompt you to select a version bump type:
        - `patch`: For backwards-compatible bug fixes
        - `minor`: For new backwards-compatible functionality
        - `major`: For breaking changes
        - `custom`: To specify a custom version
    - You can also use `--yes` flag to skip prompts and use the default version bump

4. **Additional Options**
    - To publish only changed packages: `npx lerna publish --since`
    - To preview changes without publishing: `npx lerna publish --dry-run`

## Troubleshooting

- If you encounter permission issues, ensure you're logged in to npm
- For package-specific issues, check the individual package's `package.json`
- If publishing fails, check the npm registry status and your network connection

## How It Works

### Automatic Dependency Resolution

The `plugma` package depends on `create-plugma`. To ensure compatibility between dist-tags, the build system automatically handles dependency resolution:

**For `@next` releases:**

- When publishing with `--dist-tag=next`, the `create-plugma` dependency is automatically set to use the `next` dist-tag
- This ensures that `npx plugma@next create` installs the correct pre-release version of `create-plugma`
- The scripts automatically detect the branch (e.g., `next`, `next-new-cli`, `develop`) to determine the appropriate tag

**For `@latest` releases:**

- When publishing without a dist-tag (or with `--dist-tag=latest`), the `create-plugma` dependency uses an exact version
- Lerna automatically converts the `workspace:*` reference to the published version number
- This ensures stable, predictable installations for production releases

These transformations happen automatically via lifecycle hooks:

- `prepack`: Updates the dependency before creating the npm package
- `postpack`: Restores the `workspace:*` reference for local development

## Notes

- The repository uses pnpm as the package manager
- All packages are managed in the `packages/` directory
- Version numbers are managed centrally through Lerna
- The version of the `plugma` package used in `create-plugma` is automatically managed by package scripts
- Dependency resolution between `plugma` and `create-plugma` is handled automatically based on the dist-tag
- Investigate if [Changesets](https://github.com/changesets/changesets) would suit this project better
