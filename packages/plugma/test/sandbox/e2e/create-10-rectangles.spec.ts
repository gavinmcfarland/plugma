import { test, expect } from '@playwright/test'

test('test', async ({ page }) => {
	await page.goto('http://localhost:6286/')
	await page.getByRole('spinbutton', { name: 'X-position' }).click()
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp')
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp')
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp')
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp')
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowUp')
	await page.getByRole('button', { name: 'Create Rectangles' }).click()
})
