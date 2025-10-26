# build

Create a build before publishing. This command bundles and minifies your plugin, preparing it for distribution.

##### Usage

```bash
plugma build [options]
```

##### Options

- `-w`, `--watch`: Watch for changes and rebuild automatically.
- `-o`, `--output`: Specify an output dir, default is `dist`.
- `-m`, `--mode`: Specify a mode.

##### Example

```bash
# Build the plugin
plugma build

# Build and watch for changes
plugma build -w
```
