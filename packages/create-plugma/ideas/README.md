# Tectonic

A flexible scaffolding tool that lets you combine templates to generate custom project setups. It supports smart merging of files across formats like JSON, JavaScript, and Markdown, using simple frontmatter or config rules to control how content is combined.

For example if you create a base template:

```bash
base/
  README.md
  package.json
```

and another template:
```bash
svelte/
  package.json
  svelte.config.js
```

Tectonic will output:

```bash
project/
  README.md # copied from base
  package.json # deep merge with base
  svelte.config.js # new file
```

## Configuring templates

You can configure templates using frontmatter.

By default each file type has its own merging strategies, but you can change them.

```yaml
merge:
  strategy: deep | shallow | append | prepend | replace
```

## blocking files

Maybe there is a way to say that you want certain files to be ignored, blocked or orevented from being created.

Perhaps this is included in a config file or a meta file.

```
[ignore]
package.json
```
