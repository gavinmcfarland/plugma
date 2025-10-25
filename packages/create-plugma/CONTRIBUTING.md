# Contributing

You can contribute to Plugma's list of templates by creating your own plugin and widget examples.

Plugma uses a powerful template system built on [Combino](https://github.com/gavinmcfarland/combino). This allows you to create composable templates that work for multiple frameworks and languages.

## Creating a Plugin or Widget Example

### Getting started

1. Copy the `blank-plugin` or `blank-widget` example as the starting point for your new example.

2. Include only files unique to your example. Everything else is included from the base template.

3. Write your code in TypeScript for consistency and type safety. Plugma will automatically generate JavaScript versions for users.

4. Update the name and other meta data in the `template.json` file which users see when they use the CLI.

Comino then automatically merges files from the base template and your example into a complete project when users use the CLI.

### Only Include Source Files

Examples typically use the base template as a foundation which is referenced in the `template.json` config. The files from the base template are merged with the files in your example. This simplifies the files you need to include and manage in your template. If the user selects a frontend framework or typescript the revelant files and dependencies are also merged. This allows examples to support multiple frameworks.

### Write In TypeScript

Write all your files in TypeScript and `create-plugma` will do the heavy lifting for you to create a JavaScript only version for users at runtime. This saves you having to manage two versions of your files.

### Adding Meta Data

Add the  relevant meta data to your example so `create-plugma` CLI can surface this to the user. You can add meta data by updating the `combino.json` file. Include the `name` and `description` you want to appear in the CLI, whether its a `plugin` or `widget` and if it has a ui and the frameworks it uses.

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

## Adding A New Framework

If you're using a framework that `create-plugma` doesnt currently support, you can propose one which can then be used by other examples.

You can duplicate the `react` framework to get an idea of what they look like.

Frameworks must contain the dependencies needed, tsconfigs and any other necessary framework specific files.
