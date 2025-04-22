# Testing Frameworks

Testing is crucial for plugin development, and Plugma provides built-in support for both unit testing and end-to-end testing. This guide covers how to set up and use testing in your Plugma projects.

## Unit Testing with Vitest

Vitest allows you to write and run unit tests for your plugin's logic.

##### Setup

Add Vitest to your project:

```bash
npx plugma add vitest
```

Start the Plugma dev server with WebSocket support:

```bash
npm run dev -- -ws
```

##### Writing Unit Tests

Create test files with extensions `.test.ts`, `.test.js`, `.spec.ts`, or `.spec.js`. Import the testing utilities from `plugma/vitest`:

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

##### Running Unit Tests

With your plugin open in Figma desktop app, run:

```bash
npx vitest
```

<blockquote class="info">
The plugin must be running in the Figma desktop app for tests to execute.
</blockquote>

## End-to-End Testing with Playwright

Playwright enables testing your plugin's UI and interactions end-to-end.

##### Setup

Add Playwright to your project:

```bash
npx plugma add playwright
```

Start the Plugma dev server with WebSocket support and a fixed port:

```bash
npm run dev -- -ws -p 4000
```

##### Writing E2E Tests

Create test files with extensions `.test.ts`, `.test.js`, `.spec.ts`, or `.spec.js`. Import the testing utilities from `plugma/playwright`:

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

##### The `main` Fixture

Use the `main` fixture to execute code in Figma's main thread:

```typescript
test('verify rectangle creation', async ({ main }) => {
	const count = await main(async () => {
		return figma.currentPage.children.length;
	});
	expect(count).toBe(1);
});
```

#### Running E2E Tests

With your plugin open in Figma desktop app, run:

```bash
npx playwright test
```

## Testing Utilities

### `launchPlugin()`

Simulates opening your plugin programmatically during tests.

```typescript
interface LaunchPluginOptions {
	pluginName: string;
	submenu?: string | null;
	switchBack?: boolean;
}

async function launchPlugin(options: LaunchPluginOptions): Promise<void>;
```

##### Example Usage

```typescript
await launchPlugin({
	pluginName: 'My Plugin',
	submenu: 'Create Rectangles',
	switchBack: true
});
```
