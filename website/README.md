# website

This website is created using Svelte Kit.

Content is managed using Stancy.

The design system is managed primarily using conventional CSS and CSS variables. The design tokens used by the website are generated using Mole.

Typography and spacing is currently implemented using Typolize but not fully adhered to.

## Developing

To preview the website and watch for changes.

```bash
npm run dev
```

To create a production version ready to publish.

```bash
npm run build
```

Make sure to create a new build of the `vars.css` which is used by the website.

```shell
npm run build:mole
```
