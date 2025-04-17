# release

This command builds your plugin and automatically creates a new GitHub release with your latest changes.

##### Usage

```bash
plugma release [version] [options]
```

If no version is specified, it will automatically update the `plugma.pluginVersion` field in `package.json`.

##### Version

- `alpha`, `beta`, `stable` or an integer (optional)

##### Options

- `--title`: Custom title for the release.
- `--notes`: Add release notes.
- `-o`, `--output`: Specify an output dir, default is `dist`.

##### Example

```bash
# Increment the next stable version
plugma release

# Release a beta version with custom title and notes
plugma release beta -t "New feature" -n "This release includes new features X and Y"
```
