# create-svelte

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/main/packages/create-svelte).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npm create svelte@latest

# create a new project in my-app
npm create svelte@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

## Development notes

Only way I could get it to work was to prerender the site by adding `export const prerender = true;` to `+layout.server.ts`.

I then had to use `@sveltejs/adapter-vercel` inside `svelte.config.js`.

SvelteMarkdown is using an old version of marked which was causing an issue during build. To overcome this I have to add the following to `package.json`.

```
"resolutions": {
		"marked": "^14.1.3"
	},
```
