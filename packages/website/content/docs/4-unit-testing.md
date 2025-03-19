# Unit testing

Unit tests are an important part of your development workflow. They help you catch bugs and ensure your plugin works as expected.

## Creating a unit test

Create a unit test by creating a file with `.test.` in their name.

```js
// rectangle-color.test.js
import { describe, test, expect } from 'plugma/testing';

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

Start the development server and run all test suites.

```bash
plugma dev # In one terminal
plugma test # In another terminal
```

### `test`

Run all test suites but watch for changes and rerun tests when they change.

### `test run`

Perform a single run without watch mode.

## Further documentation

For more options and documentationsee the [Vitest](https://vitest.dev/guide/) site.
