# Testing frameworks

Testing is an important part of plugin development. Traditionally, this can be hard to accomplish. However, with Plugma makes this easier by enabling certain features.

## Unit Testing with Vitest

You can write unit tests for your plugin’s main code by creating files that end with `.test.ts` or `.test.js`.

### Add Vitest

First, add Vitest as an integration.

```bash
npx plugma add vitest
```

### Writing tests

To write a test, import `test` and `expect` from `plugma/vitest`:

```js
// create-rectangle.test.js
import { test, expect } from 'plugma/vitest';

test('creates a rectangle with specific color', async () => {
    const rect = figma.createRectangle();

    rect.fills = [{
        type: 'SOLID',
        color: { r: 0.5, g: 0.5, b: 0.5 }
    }];

    expect(rect.type).to.equal('RECTANGLE');
    expect(rect.fills[0].type).to.equal('SOLID');
    expect((rect.fills[0] as SolidPaint).color).to.deep.equal({
        r: 0.5, g: 0.5, b: 0.5
    });
});
```

### Running tests

Now start the Plugma dev server with websockets enabled.

```bash
npm run dev -- -ws
```

With the plugin open in the Figma desktop app, now run the tests.

```bash
npx vitest
```

<blockquote class="info">
The plugin must be running in the Figma desktop app for tests to run.
</blockquote>

## End-to-End Testing with Playwright

Plugma also supports end-to-end testing of your UI using Playwright.

### Add Playwright

First, add Playwright as an integration.

```bash
npx plugma add playwright
```

### Writing tests

You can write end-to-end tests for your plugin by configuring Playwright and creating files that end with `.test.ts` or `.test.js`.

```js
// create-10-rectangles.test.js
import { test, expect } from 'plugma/playwright';

test('create 10 rectangles', async ({ page, main }) => {
	await page.goto('http://localhost:4000/');
	await page.getByRole('spinbutton', { name: 'X-position' }).click();
	await page.getByRole('spinbutton', { name: 'X-position' }).fill('10');
	await page.getByRole('button', { name: 'Create Rectangles' }).click();

	const rects = await main(async () => {
		return figma.currentPage.children;
	});

	expect(rects.length).toBe(1);
});
```

### Running tests

Now start the Plugma dev server with websockets enabled and a fixed port.

```bash
npm run dev -- -ws -p 4000
```

With the plugin open in the Figma desktop app, now run the tests with Playright.

```bash
npx playwright test
```

## Helpers

### `launchPlugin()`

Simulates the user opening the plugin. Useful for automating tests which require the plugin to be open.

#### Type signature

```js
function launchPlugin({
    pluginName: string,
    submenu: string | null = null,
    switchBack: boolean = false
}) : Promise<void>;
```
