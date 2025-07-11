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
        "customFeature" = "It's awesome"
    }
}
```

#### Conditional File Processing

Use conditional directories to include files based on user choices:

```
[framework=="react"]/
├── App.tsx
└── components/
    └── Button.tsx

[framework=="svelte"]/
├── App.svelte
└── components/
    └── Button.svelte
```

#### File Merging Strategies

Define how files should be merged when multiple templates provide the same file:

```ini
[merge:*.json]
strategy = deep

[merge:*.md]
strategy = shallow

[merge:package.json]
strategy = deep
```

### Testing Your Template

1. **Local testing**: Test your template locally before contributing
2. **Validation**: Ensure all template variables are properly defined
3. **Compatibility**: Test with different framework and TypeScript combinations

### Contributing Your Template

1. **Fork the repository**
2. **Create your template** following the structure above
3. **Add documentation** explaining what your template provides
4. **Submit a pull request** with a clear description

### Template Best Practices

1. **Keep it focused**: Each template should have a clear purpose
2. **Use meaningful names**: Template names should indicate their purpose
3. **Provide documentation**: Include README files explaining usage
4. **Follow conventions**: Use the established naming and structure conventions
5. **Test thoroughly**: Ensure your template works with all supported combinations

### Example: Creating a "Dashboard" Template

Here's a complete example of creating a dashboard plugin template:

**Directory structure:**

```
templates/examples/plugin/dashboard/
├── .combino
├── manifest.json
├── package.json
├── README.md
└── src/
    ├── main/
    │   └── main.ts
    └── ui/
        ├── App.svelte
        ├── components/
        │   ├── Dashboard.svelte
        │   ├── Chart.svelte
        │   └── Stats.svelte
        └── styles/
            └── dashboard.css
```

**.combino file:**

```ini
[include]
../../../base
../../../frameworks/<%= framework %>/components = src/ui/components
../../../frameworks/<%= framework %>/assets = src/ui/assets

[data]
description = "A comprehensive dashboard plugin template"
hasCharts = true
hasStats = true
uiDir = src/ui
mainDir = src/main
```

**manifest.json:**

```json
{
    "id": "com.<%- name %>",
    "name": "<%- name %>",
    "main": "src/main/main.<%- typescript ? 'ts' : 'js' %>",
    "ui": "src/ui/ui.<%- framework === 'react' ? (typescript ? 'tsx' : 'jsx') : (typescript ? 'ts' : 'js') %>",
    "editorType": ["figma", "figjam"],
    "networkAccess": {
        "allowedDomains": ["none"]
    }
}
```

This template would provide a complete dashboard plugin structure that users can customize for their specific needs.

### Need Help?

If you need help creating templates or have questions about the template system:

1. **Check existing templates** for examples and patterns
2. **Review the Combino documentation** for advanced features
3. **Open an issue** on GitHub for support
4. **Join the community** discussions

Happy templating! 🎨
