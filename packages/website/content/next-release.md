## V1 Coming Soon

After several months of intensive development and refactoring, we’re excited to announce that Plugma’s next release is nearly production-ready. This upcoming version brings powerful new features and performance enhancements, all based on feedback from our developer community and real-world usage insights. Get ready to experience a streamlined, more robust way to develop Figma plugins with Plugma!

### Try it today!

Want an early look? You can get started with Plugma V1 today by following these commands:

#### Updating an existing plugin

```package-manager
npm install plugma@next
```

#### Starting a new plugin from scratch

```package-manager
npm create plugma@next
```

### What's new

We’ve listened closely to your feedback and have made significant upgrades to enhance stability, flexibility, and overall ease of use. Here’s what you can expect:

1.  Messages now wait until the WebSocket connection is open, making browser previews better than ever.
2.  Figma’s dark/light mode now syncs instantly, thanks to a smarter iframe setup.
3.  Use the `--mode` flag and `.env` files to test different setups, without needing extra configs.
4.  Manage all builds with a single `vite.config.js` file that’s ready for dev and production.
5.  Activate developer tools anytime with `Cmd + Opt + J`, no restart needed.
6.  Preview in the browser with a minimized plugin window in Figma, keeping your workspace clear.
