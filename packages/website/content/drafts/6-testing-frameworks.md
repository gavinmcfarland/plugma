# Testing Frameworks

Plugma provides built-in support for both unit testing and end-to-end testing to help you ensure your plugin works correctly. This guide covers how to set up and use testing in your Plugma projects.

<blockquote class="warning">
The following testing frameworks are experimental and their implementation may change in future versions.
</blockquote>

## Overview

Plugma supports two main testing approaches:

1. **Unit Testing with Vitest**: Test individual components and functions of your plugin
2. **End-to-End Testing with Playwright**: Test your plugin's UI and interactions as a whole

## Unit Testing with Vitest

Vitest is ideal for testing individual components and functions of your plugin's logic.

### Setup

Add Vitest to your project by running:

```bash
npx plugma add
```

Then select Vitest from the available integrations.

### Writing Unit Tests

1. Create test files with any of these extensions:

    - `.test.ts`
    - `.test.js`
    - `.spec.ts`
    - `.spec.js`

2. Import the testing utilities from `plugma/vitest`:

**Example**

```typescript
import { test, expect } from 'plugma/vitest';

test('creates a rectangle with specific color', async () => {
	const rect = figma.createRectangle();

	rect.fills = [
		{
			type: 'SOLID',
			color: { r: 0.5, g: 0.5, b: 0.5 }
		}
	];

	expect(rect.type).toBe('RECTANGLE');
	expect(rect.fills[0].type).toBe('SOLID');
	expect((rect.fills[0] as SolidPaint).color).toEqual({
		r: 0.5,
		g: 0.5,
		b: 0.5
	});
});
```

### Running Unit Tests

1. Open your plugin in the Figma desktop app
2. Start the dev server with WebSockets enabled:

```package-manager
npm run dev -- -ws
```

3. Run the tests:
    ```bash
    npx vitest
    ```

## End-to-End Testing with Playwright

Playwright enables you to test your plugin's UI and interactions from a user's perspective.

### Setup

Add Playwright to your project by running:

```bash
npx plugma add
```

Then select Playwright from the available integrations.

### Writing E2E Tests

1. Create test files with any of these extensions:

    - `.test.ts`
    - `.test.js`
    - `.spec.ts`
    - `.spec.js`

2. Import the testing utilities from `plugma/playwright`:

**Example**

```typescript
import { test, expect } from 'plugma/playwright';

test('creates multiple rectangles', async ({ page, ui, main }) => {
	// Interact with the UI
	await ui.goto('http://localhost:4000/');
	await ui.getByRole('spinbutton', { name: 'X-position' }).fill('10');
	await ui.getByRole('button', { name: 'Create Rectangles' }).click();

	// Test Figma main thread code
	const rects = await main(async () => {
		return figma.currentPage.children;
	});

	expect(rects.length).toBe(10);
});
```

### Key Concepts

#### The `main` Fixture

The `main` fixture allows you to execute code in Figma's main thread. This is essential for testing Figma-specific functionality:

```typescript
test('verify rectangle creation', async ({ main }) => {
	const count = await main(async () => {
		return figma.currentPage.children.length;
	});
	expect(count).toBe(1);
});
```

<blockquote class="warning">
Currently, all functions that are required for Figma must be included in the main fixture as it is evaluated in the main thread.
</blockquote>

### Running E2E Tests

1. Start the Plugma dev server with WebSocket support and a fixed port:

```package-manager
npm run dev -- -ws -p 4000
```

2. With your plugin open in the Figma desktop app, run:
    ```bash
    npx playwright test
    ```

## Testing Utilities

### `launchPlugin()`

The `launchPlugin()` utility helps you programmatically open your plugin during tests.

```typescript
interface LaunchPluginOptions {
	submenu?: string | null; // Optional submenu name
	returnToEditor?: boolean; // Whether to return focus to the Figma editor after launching
}

async function launchPlugin(name: string, options: LaunchPluginOptions): Promise<void>;
```

#### Example Usage

```typescript
import { launchPlugin } from 'plugma/utils';

launchPlugin('My Plugin, {
	submenu: 'Create Rectangles',
	returnToEditor: true
});
```
