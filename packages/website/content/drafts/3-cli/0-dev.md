# dev

Start a server to develop your plugin. This command builds a placeholder `ui.html` that points to the dev server. This enabled various developer tools to help you build your plugin.

##### Usage

```bash
plugma dev [options]
```

##### Options

- `-p`, `--port`: Specify a port number for the plugin preview.
- `-o`, `--output`: Specify an output dir, default is `dist`.
- `-m`, `--mode`: Specify a mode.
- `-ws`, `--websockets`: Enable WebSockets to preview in browser.

##### Example

```bash
# Start development server on port 3000
plugma dev -p 3000

# Start development server with websockets enabled
plugma dev -ws
```
