### Todo

1. Add logic so server version is used when developing, but bundled version is used when come to publish using envronment variables
2. Add postcss

### Old stuff

This template should help get you started developing with Svelte and TypeScript in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).

## Need an official Svelte framework?

Check out [SvelteKit](https://github.com/sveltejs/kit#readme), which is also powered by Vite. Deploy anywhere with its serverless-first approach and adapt to various platforms, with out of the box support for TypeScript, SCSS, and Less, and easily-added support for mdsvex, GraphQL, PostCSS, Tailwind CSS, and more.

## Technical considerations

**Why use this over SvelteKit?**

- It brings its own routing solution which might not be preferable for some users.
- It is first and foremost a framework that just happens to use Vite under the hood, not a Vite app.

This template contains as little as possible to get started with Vite + TypeScript + Svelte, while taking into account the developer experience with regards to HMR and intellisense. It demonstrates capabilities on par with the other `create-vite` templates and is a good starting point for beginners dipping their toes into a Vite + Svelte project.

Should you later need the extended capabilities and extensibility provided by SvelteKit, the template has been structured similarly to SvelteKit so that it is easy to migrate.

**Why `global.d.ts` instead of `compilerOptions.types` inside `jsconfig.json` or `tsconfig.json`?**

Setting `compilerOptions.types` shuts out all other types not explicitly listed in the configuration. Using triple-slash references keeps the default TypeScript setting of accepting type information from the entire workspace, while also adding `svelte` and `vite/client` type information.

**Why include `.vscode/extensions.json`?**

Other templates indirectly recommend extensions via the README, but this file allows VS Code to prompt the user to install the recommended extension upon opening the project.

**Why enable `allowJs` in the TS template?**

While `allowJs: false` would indeed prevent the use of `.js` files in the project, it does not prevent the use of JavaScript syntax in `.svelte` files. In addition, it would force `checkJs: false`, bringing the worst of both worlds: not being able to guarantee the entire codebase is TypeScript, and also having worse typechecking for the existing JavaScript. In addition, there are valid use cases in which a mixed codebase may be relevant.

**Why is HMR not preserving my local component state?**

HMR state preservation comes with a number of gotchas! It has been disabled by default in both `svelte-hmr` and `@sveltejs/vite-plugin-svelte` due to its often surprising behavior. You can read the details [here](https://github.com/rixo/svelte-hmr#svelte-hmr).

If you have state that's important to retain within a component, consider creating an external store which would not be replaced by HMR.

```ts
// store.ts
// An extremely simple external store
import { writable } from "svelte/store";
export default writable(0);
```

### Notes

"build:code2": "esbuild src/code.ts --bundle --outfile=dist/code.js --define:process.env.NODE_ENV='\"test\"'",

### Old Scripts

```
"scripts": {
    "dev": "vite & npm run dev:code",
    "build": "vite build && npm run build:code",
    "build:code": "esbuild src/code/main.ts --bundle --outfile=dist/code.js --minify",
    "dev:code": "esbuild src/code/main.ts --bundle --outfile=dist/code.js --watch",
    "dev:server-old": "vite dev --mode server & npm run dev:code & npm run server",
    "dev:server": "vite dev --mode server & npm run dev:code",
    "preview": "vite preview",
    "check": "svelte-check --tsconfig ./tsconfig.json",
    "server": "node server.cjs"
  },
```

### Environment variable does not work across server and plugin

`import.meta.env.MODE` is not consistant when viewing same page in plugin window, versus in browser. Need another way to track that setting.

- I think there is something wrong with the build scripts, tripping over one another

- Use `npm link` to install local bin scripts in package, ie `plugma`

- Possible to create cli that creates a figma plugin but for any framework?

- for now, until packages are published need to run `npm pack` and them copy package to new plugin and install `npm install plugma-0.0.1.tgz`

## Challenge

- Problem I've got is that I want to hide the html and main files. They're different for each framework. The html file I want to be generated from one file.
- Issues:
  - If I rely on installing the common module as a dependency, I can't customise the index file for the given project because it gets over ridden when the user installs their dependencies
- I could use a post-install script and update the index file after the dependancy is installed
- I could create a build a script which the user runs to build the project (more effort?)
- I could build a vite plugin instead of this project, but then I'd miss out on the great things the project has.
- I should add a field to the package.json that tells me what framework their using
- Don't use "file: " in package.json as it only acts as a symlink and causes issues with relative file paths
- Files stored in node_modules are not checked for changes in vite because of caching (https://github.com/vitejs/vite/issues/8619#issuecomment-1707700396)

## Todo

- Do I need to create my own build and dev commands, so that source code can be injected into plugins?
- Maybe manifest is included in package.json, or at the least distributed to dist when built
- Look at manifest file to determine where to look for ui.ts and main.ts file
- Configure typescript properly
- Decide on npm package name
- Make sure env variables are being passed through to vite DONE
- Generate ui.html file when dev script run
- Find a way to run websocket on vite server or run node server alongside. Fix issue with closing and opening servers
- Add a way to specify which port, so that it matches with what's in main.js (inerceptHTML)
- Disable running server in script for now (need to create custom script)

```shell
plugma dev
```

This script does the following in this order:

1. Creates a `manifest.json` file
2. Builds the `main.js` file using `esbuild`
3. Builds `ui.html` file
4. Uses location of `main` and `ui` to build plugin
5. Starts a Vite development server to mount the UI
6. Starts a Websocket server

```shell
plugma build
```

This script does the following in this order:

2. Creates a `manifest.json` file
1. Builds the `main.js` file using `esbuild` and minifies it
1. Builds the `ui.html` file using Vite

## Helpers

- ### Messaging

  - #### `on(event, callback)`

    **Parameters**

    - **`event`** { String } the name of the event
    - **`callback`** { Function }

  - #### `emit(event, callback)`

    **Parameters**

    - **`event`** { String } the name of the event
    - **`callback`** { Function } _Optional_ If provided, it will return the result from the event handler with the same event name.

- ### UI

  - #### `ui`

    Stores the state for the UI.

    **Example**

    ```js
    export function(ui) {
      ui = {
        width: 400,
        height: 600
      }

      ui.show(data)
    }
    ```

## running plugma in a fresh vite project

- Issue: plugma needs to be installed in root of project, to find files in node module
- Note: file names need to match default that comes with vite project
- Note: main.ts needs to be created in a vite project (Figma main thread file)
- Note: Plugma doesn't look in root for html template (currently anyway), so it's redunant
- Issue: vite.config.ts file needs to point to plugma's because it contains the source code to inject scripts and other stuff...
