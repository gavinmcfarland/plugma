import { test, expect } from '../node_modules/plugma/dist/testing/playwright'

async function clearCanvas(main: any) {
	return await main(async () => {
		figma.currentPage.children.forEach((child) => {
			child.remove()
		})
	})
}

// Error: in get_componentPropertyDefinitions: Can only get component property definitions of a component set or non-variant component
test('get selection', async ({ ui, main }) => {
	const selection = await main(async () => {
		console.log('figma.currentPage.selection', figma.currentPage.selection)
		return figma.currentPage.selection
	})

	expect(selection.length).toBe(6)
})
