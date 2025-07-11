# Contributing

You can contribute to Plugma's list of templates by creating your own templates.

Plugma uses a powerful template system built on [Combino](https://github.com/gavinmcfarland/combino) that allows you to create reusable, composable templates for Figma plugins and widgets. This guide will walk you through creating your own templates.

## Create an Example Template

Get started by copying the `hello-world-plugin` example.

Create the files that will be part of your template. If your plugin or widget includes a UI be sure to make the files for the UI conditional for one or more frontend frameworks.

```
my-example-plugin/
├── combino.json
├── manifest.json
├── README.md
├── src/
│   ├── main/
│   │   └── main.ts
│   └── ui/
│       └── [framework="react"]/
│           └── App.tsx
```

You don’t need to include any dependencies for the Figma API, common frameworks (e.g. Svelte, React), or tsconfig files, these are automatically handled by the CLI.

### Adding Meta Data

You can add meta data to your example by updating the `combino.json` file.

```json
{
    "meta": {
        "name": "My Example Plugin",
        "description": "Does something awesome",
        "type": "plugin",
        "uiFrameworks": ["react"]
    }
}
```

### Using data

You can add data used by your template inside the `combino.json` file at the root of your template.

```json
{
    "data": {
        "customFeature": "It's awesome"
    }
}
```
