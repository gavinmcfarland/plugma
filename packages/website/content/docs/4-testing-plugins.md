# Testing plugins

Testing is an important part of development plugins. Plugma comes with tools thag allow you to test your plugin works as expected.

## Unit testing the main code

You can write unit tests for your plugin’s main code by creating files that end with `.test.ts` or `.test.js`.

### Writing tests

To write a test, import `test` and `expect` from `plugma/testing`:

```js
// create-rectangle.test.js
import { test, expect } from 'plugma/testing';

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

First, start the dev server in one terminal.

```bash
npm run dev
```

Then, in another terminal, run:

```bash
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
function launchPlugin(
    pluginName: string,
    switchBack: boolean = false
) : void;
```

### Further documentation

For more options and documentation see the [Vitest](https://vitest.dev/guide/) site.

## End-to-End (E2E) UI Testing with Playwright

Plugma supports end-to-endbtesting of your UI using Playwright.

### Install Playwrite 

First, set up Playwright.

```bash
npm init playwright@latest
```

Now create a test.

```js
// create-10-rectangles.test.js
import { test, expect } from '@playwright/test'

test('create 10 rectangles', async ({ page }) => {
	await page.goto('http://localhost:4000/')
	await page.getByRole('spinbutton', { name: 'X-position' }).click()
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp')
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp')
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp')
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp')
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp')
	await page.getByRole('button', { name: 'Create Rectangles' }).click()
})
```

Now start the Plugma dev server with websockets enabled and a fixed port.

```bash
npm run dev -- -ws -p 4000
```

With the plugin open in the Figma desktop app, now run the tests with Playright.

```bash
npx playwright test
```
