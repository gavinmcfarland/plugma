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
    - Or publish from the appropriate branch (e.g., `next`, `next-new-cli`, `develop`) which will auto-detect the tag

3. **Push to Remote**

    After publishing completes, you'll need to manually push the commits and tags to the remote repository:

    ```bash
    git push && git push --tags
    ```

    **Why manual push?** The publishing process creates two commits:
    - First commit: Version bump with updated `create-plugma` dependency
    - Second commit: Restores `workspace:*` reference for local development

    Both commits and version tags need to be pushed together after the packages are successfully published to npm.

4. **Version Selection**
    - Lerna will prompt you to select a version bump type:
        - `patch`: For backwards-compatible bug fixes
        - `minor`: For new backwards-compatible functionality
        - `major`: For breaking changes
        - `custom`: To specify a custom version
    - You can also use `--yes` flag to skip prompts and use the default version bump

5. **Additional Options**
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

- When publishing without a dist-tag (or with `--dist-tag=latest`), the script keeps `workspace:*` as-is
- However, since Lerna with pnpm doesn't convert workspace protocol, you should avoid this scenario
- For now, all releases should use `@next` tag until workspace protocol handling is improved

These transformations happen automatically via lifecycle hooks:

- `version`: Runs during version bumping to update the `create-plugma` dependency based on the dist-tag
- `postpublish`: Runs after publishing to restore the `workspace:*` reference for local development

**Important:** The dependency changes are committed to git. The version commit contains the updated dependency (e.g., `"create-plugma": "next"`), which is what gets published to npm. A second commit immediately after restores `workspace:*` for local development.

## Notes

- The repository uses pnpm as the package manager
- All packages are managed in the `packages/` directory
- Version numbers are managed centrally through Lerna
- The version of the `plugma` package used in `create-plugma` is automatically managed by package scripts
- Dependency resolution between `plugma` and `create-plugma` is handled automatically based on the dist-tag
- Investigate if [Changesets](https://github.com/changesets/changesets) would suit this project better
