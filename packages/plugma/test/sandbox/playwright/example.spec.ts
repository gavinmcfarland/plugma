import { test, expect } from 'plugma/playwright';

test('create 10 rectangles', async ({ ui, main }) => {
	await ui.goto('http://localhost:4000/');
	await ui.getByRole('spinbutton', { name: 'X-position' }).click();
	await ui.getByRole('spinbutton', { name: 'X-position' }).fill('10');
	await ui.getByRole('button', { name: 'Create Rectangles' }).click();

	const rects = await main(async () => {
		return figma.currentPage.children;
	});

	expect(rects.length).toBe(10);
});
