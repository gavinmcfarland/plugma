# Testing plugins

Testing is an important part of plugin development. Traditionally, this can be hard to accomplish. However, with Plugma, you can test your plugin using various tools.

<blockquote class="warning">
This is a work in progress and the implementation may change. You can also test the UI end-to-end using Playwright by running the following command, following the instructions and making sure the dev server is running with websockets enabled before running any tests.

```package-manager
npm init playwright@latest
```

</blockquote>

## Unit testing the main code

You can write unit tests for your plugin’s main code by creating files that end with `.test.ts` or `.test.js`.

### Example of a unit test

To write a test, import `test` and `expect` from `plugma/test`:

```js
// create-rectangle.test.js
import { test, expect } from 'plugma/test';

test('creates a rectangle with specific color', async ({ ui, figma }) => {
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

### Example of an end-to-end test:

```js
test('creates 10 rectangles', async ({ ui, figma }) => {
	await ui.goto('http://localhost:4000/');
	await ui.getByRole('spinbutton', { name: 'X-position' }).fill('10');
	await ui.getByRole('button', { name: 'Create Rectangles' }).click();

	const rectangles = figma.currentPage.findAllWithCriteria({
		criteria: {
			type: 'RECTANGLE'
		}
	});
	expect(rectangles.length).to.equal(10);
});
```

### Init a test

```bash
npx plugma init-test
```

### Running tests

First, start the dev server in one terminal.

```package-manager
npm run dev
```

Then, in another terminal, run:

```package-manager
npm run test
```

Once the plugin is open the test runner will connect to the plugin and execute all `.test.ts` or `.test.js` files.

<blockquote class="info">
The plugin must be running in the Figma desktop app for tests to run.
</blockquote>

### Helpers

#### `launchPlugin()`

Simulates the user opening the plugin. Useful for automating tests which require the plugin to be open.

##### Type signature

```js
function launchPlugin({
    pluginName: string,
    submenu: string | null = null,
    switchBack: boolean = false
}) : Promise<void>;
```

### Further documentation

For more options and documentation see the [Vitest](https://vitest.dev/guide/) site.

<!-- ## End-to-End UI Testing

Plugma also supports end-to-end testing of your UI using Playwright.

### Install Playwright

First, set up Playwright.

```bash
npm init playwright@latest
```

### Writing tests

You can write end-to-end tests for your plugin by configuring Playwright and creating files that end with `.test.ts` or `.test.js`.

```js
// create-10-rectangles.test.js
import { test, expect } from '@playwright/test';

test('create 10 rectangles', async ({ page }) => {
	await page.goto('http://localhost:4000/');
	await page.getByRole('spinbutton', { name: 'X-position' }).click();
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp');
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp');
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp');
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp');
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp');
	await page.getByRole('button', { name: 'Create Rectangles' }).click();
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
``` -->
