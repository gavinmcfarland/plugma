# Unit testing

Unit tests are an important part of your development workflow. They help you catch bugs and ensure your plugin works as expected.

## Creating a unit test

Create a unit test by creating a file with `.test.` in their name.

```js
// rectangle-color.test.js
import { describe, it, expect } from 'plugma/testing';

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

First ensure the developer server is running.

```bash
plugma dev
```

Use the `test` command to run and rerun tests automatically.

```bash
plugma test
```

Perform a single run without watch mode.

```bash
plugma test run
```

<blockquote class="warning">
The developer server must be running first by using the `dev` command before running tests.
</blockquote>

## Further documentation

For more options and documentationsee the [Vitest](https://vitest.dev/guide/) site.
