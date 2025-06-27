# Contributing

You can contribute to Plugma's list of templates by creating your own templates.

## Create Your Own Example Template

Plugma uses a powerful template system built on [Combino](https://github.com/gavinmcfarland/combino) that allows you to create reusable, composable templates for Figma plugins and widgets. This guide will walk you through creating your own templates.

### Create a directory

Create your template directory in the `templates/examples/` directory.

```bash
cd templates/examples/
mkdir my-custom-example
```

### Add template files

Create the files that will be part of your template. If you're plugin or widget includes a UI be sure to make the files for the UI conditional for one or more frontend frameworks.

```
my-awesome-template/
├── .combino
├── manifest.json
├── package.json
├── README.md
├── src/
│   ├── main/
│   │   └── main.ts
│   └── ui/
│       └── [framework="react"]/
│           └── App.tsx
```

### Using data

You can add data used by your template inside a `.combino` file at the root of your template.

```ini
[data]
description = "My awesome plugin template"
uiDir = src/ui
mainDir = src/main
customFeature = true
```

This allows you use dynamic content using EJS syntax in different ways.

1. **Template Variables:**

    ```json
    // manifest.json
    {
        "id": "com.<%- name %>",
        "name": "<%- name %>",
        "main": "src/main/main.<%- typescript ? 'ts' : 'js' %>",
        "ui": "src/ui/ui.<%- framework === 'react' ? (typescript ? 'tsx' : 'jsx') : (typescript ? 'ts' : 'js') %>",
        "editorType": ["figma", "figjam"]
    }
    ```

2. **Conditional Directories and Files:**

    - `[framework=="react"]/`: Only included for React projects
    - `[typescript]/`: Only included when TypeScript is selected

---

#### Create the `.combino` configuration

The `.combino` file is the heart of your template. It defines:

- **Template composition**: Which other templates to include
- **Data variables**: Template-specific data
- **File operations**: Copying, merging, and transforming files

Example `.combino` file:

```ini
[include]
../../../base
../../../frameworks/<%= framework %>/components = src/ui/components
../../../frameworks/<%= framework %>/assets = src/ui/assets

[data]
description = "My awesome plugin template"
uiDir = src/ui
mainDir = src/main
customFeature = true
```

#### Step 5: Use Template Variables

Templates support dynamic content using EJS syntax and conditional directories:

**Template Variables:**

- `<%= name %>`: Project name
- `<%= framework %>`: Selected framework (react, svelte, vue, vanilla)
- `<%= typescript %>`: Boolean for TypeScript support
- `<%= type %>`: Project type (plugin, widget)

**Conditional Directories:**

- `[framework=="react"]/`: Only included for React projects
- `[typescript]/`: Only included when TypeScript is selected
- `[framework=="svelte"][typescript]/`: Multiple conditions

**Example manifest.json:**

```json
{
    "id": "com.<%- name %>",
    "name": "<%- name %>",
    "main": "src/main/main.<%- typescript ? 'ts' : 'js' %>",
    "ui": "src/ui/ui.<%- framework === 'react' ? (typescript ? 'tsx' : 'jsx') : (typescript ? 'ts' : 'js') %>",
    "editorType": ["figma", "figjam"]
}
```

### Template Composition

Templates are composed in order of priority (highest to lowest):

1. **TypeScript template** (if selected)
2. **Example template** (user's choice)
3. **Framework template** (user's choice)
4. **Base template** (always included)

This allows for:

- **Inheritance**: Each template builds on the previous ones
- **Overrides**: Higher priority templates can override lower priority ones
- **Composition**: Multiple templates can be combined

---

### Advanced Features

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

#### Custom File Transformations

You can transform files during the template generation process:

```ini
[transform:*.js]
# Custom transformation logic
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

## Other

### Template Structure

Templates are organized in a hierarchical structure that allows for composition and customization:

```
templates/
├── base/                    # Base template (always included)
├── frameworks/              # Framework-specific templates
│   ├── react/
│   ├── svelte/
│   └── vue/
├── examples/                # Example templates
│   ├── plugin/
│   │   ├── basic/
│   │   └── minimal/
│   └── widget/
└── typescript/              # TypeScript-specific additions
```

### Template Components

#### 1. Base Template (`templates/base/`)

The base template provides the foundation that all other templates build upon. It includes:

- **Essential files**: `package.json`, `vite.config.js`, `.gitignore`, `README.md`
- **Common configuration**: Basic Vite setup, standard dependencies
- **Template metadata**: Version information and merge strategies

Key files:

- `.combino`: Defines merge strategies and base data
- `package.json`: Core dependencies and Plugma configuration
- `vite.config.js`: Base Vite configuration

#### 2. Framework Templates (`templates/frameworks/[framework]/`)

Framework-specific templates add framework-specific configurations and dependencies:

- **Framework dependencies**: React, Svelte, Vue, etc.
- **Build configuration**: Framework-specific Vite plugins
- **Component templates**: Framework-specific UI components
- **Asset handling**: Framework-specific asset processing

#### 3. Example Templates (`templates/examples/[type]/[example]/`)

Example templates provide complete, working implementations:

- **Plugin examples**: Complete plugin implementations
- **Widget examples**: Complete widget implementations
- **Different complexity levels**: From minimal to full-featured

#### Step 1: Choose Your Template Type

Decide what type of template you want to create:

- **Base template**: Foundation for other templates
- **Framework template**: Framework-specific additions
- **Example template**: Complete working example
- **Specialized template**: Custom functionality
