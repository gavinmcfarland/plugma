# Unit testing

Unit tests are an important part of your development workflow. They help you catch bugs and ensure your plugin works as expected.

## Writing unit tests

Under the hood, Plugma uses [Vitest](https://vitest.dev/guide/) for running tests.

You can write unit tests by creating files with `.test.` in their name.

##### Example test

Below is an example of a test that creates a rectangle and confirms it has been created with a specific colour.

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

## Running tests

To run the tests, start the development server and run the `test` command.

```bash
npm run dev # In one terminal
npm run test # In another terminal
```

<blockquote class="info">
The plugin must be running in the Figma desktop app for tests to run.
</blockquote>

### Commands

#### `test`

Run all test suites but watch for changes and rerun tests when they change.

#### `test run`

Perform a single run without watch mode.

## Further documentation

For more options and documentation see the [Vitest](https://vitest.dev/guide/) site.
