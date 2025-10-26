# Why Plugma?

Unlike general-purpose bundlers, Plugma is purpose-built for Figma plugins — no config, no boilerplate, just a development workflow that supports testing, previews, and production-grade output.

It’s made specifically for Figma plugin development — not just to compile your files, but to make your entire workflow faster, easier, and a lot less painful. Whether you’re hacking together your first plugin or running a serious production project, Plugma gives you the tools you actually need.

## Who It's For

Plugma is built for:

- **New plugin developers** who want a simple, no-hassle way to start building
- **Experienced devs** who want more control, better testing, and faster feedback loops
- **Teams** who need a consistent, predictable setup that scales with bigger projects

If you’re building plugins for Figma, Plugma’s built for you.

## What Makes Plugma Different

- **Zero config setup** — Get straight to building  
- **Real-time browser preview** — See your plugin in any browser without publishing
- **Built-in dev toolbar** — Clear storage, plugin data with ease
- **First-class test support** — Write unit tests and end-to-end tests  
- **Customizable build process** — Tweak it if you need to
- **Production-ready builds** — Ship clean, optimized plugins every time  

## How Plugma Works

When you’re developing a plugin, you don’t want slow reloads or clunky workflows. Plugma’s two main commands — `dev` and `build` — are designed to keep things fast while still letting you test properly.

### Developing with `plugma dev`

Running `plugma dev` fires up a local server that hosts your plugin’s UI in the browser. But it’s more than just a server — Plugma also injects a developer toolbar and sets up a full communication bridge between your UI and the main thread to enable advanced developer tooling. You can preview instantly in the UI without reloading the plugin, reset client storage with a click, and test plugin events without bouncing back and forth to Figma.

It’s a close simulation of how your plugin behaves inside Figma — close enough for fast development, but not 100% perfect. So if something seems weird, it’s smart to double-check it using the build process.

### Building with `plugma build`

When you’re ready to see how your plugin will actually behave inside Figma, you run `plugma build`. It strips out all the development extras and bundles a clean, production-ready plugin folder that’s safe to publish.

You can also run `plugma build --watch` if you want automatic rebuilds without using the dev server — perfect if you’re in the polishing phase and want to stay close to the real environment.

In short: use `dev` while you’re moving fast, and `build` when you’re getting serious.

## TL;DR

Plugma saves you time, lets you build better plugins faster, and gives you serious tools without serious complexity.  
If you’re building Figma plugins, Plugma will help you get there.
