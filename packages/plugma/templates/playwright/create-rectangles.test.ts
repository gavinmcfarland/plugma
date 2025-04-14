import { test, expect } from '../node_modules/plugma/dist/testing/playwright'

async function clearCanvas(main) {
	return await main(async () => {
		figma.currentPage.children.forEach((child) => {
			child.remove()
		})
	})
}

test('create 10 rectangles', async ({ ui, main }) => {
	await clearCanvas(main)

	await ui.goto('http://localhost:4000/')
	await ui.getByRole('spinbutton', { name: 'X-position' }).click()
	await ui.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp')
	await ui.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp')
	await ui.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp')
	await ui.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp')
	await ui.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp')
	await ui.getByRole('button', { name: 'Create Rectangles' }).click()

	const rects = await main(async () => {
		return figma.currentPage.children
	})

	expect(rects.length).toBe(10)
})

test('create 1 rectangle', async ({ page, main }) => {
	await main(async () => {
		figma.currentPage.children.forEach((child) => {
			child.remove()
		})
	})

	await page.goto('http://localhost:4000/')
	await page.getByRole('spinbutton', { name: 'X-position' }).click()
	await page.getByRole('spinbutton', { name: 'X-position' }).fill('1')
	await page.getByRole('button', { name: 'Create Rectangles' }).click()

	const rects = await main(async () => {
		return figma.currentPage.children
	})

	expect(rects.length).toBe(1)
})

test('verify rectangle count display', async ({ page, main }) => {
	await main(async () => {
		figma.currentPage.children.forEach((child) => {
			child.remove()
		})
	})

	await page.goto('http://localhost:4000/')

	await expect(page.locator('.node-count')).toHaveText('0 nodes selected')

	await page.getByRole('button', { name: 'Create Rectangles' }).click()

	const nodeCount = await main(async () => {
		let rects = figma.currentPage.children
		figma.currentPage.selection = rects
		return figma.currentPage.selection.length
	})

	await expect(page.locator('.node-count')).toHaveText(`${nodeCount} nodes selected`)
})