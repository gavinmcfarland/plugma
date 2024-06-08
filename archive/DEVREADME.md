## running plugma in a fresh vite project

- Issue: plugma needs to be installed in root of project, to find files in node module
- Note: file names need to match default that comes with vite project
- Note: main.ts needs to be created in a vite project (Figma main thread file)
- Note: Plugma doesn't look in root for html template (currently anyway), so it's redunant
- Issue: vite.config.ts file needs to point to plugma's because it contains the source code to inject scripts and other stuff...
