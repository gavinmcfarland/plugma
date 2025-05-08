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

2. **Run the Publish Command**

    ```bash
    pnpm publish
    ```

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

## Notes

- The repository uses pnpm as the package manager
- All packages are managed in the `packages/` directory
- Version numbers are managed centrally through Lerna
