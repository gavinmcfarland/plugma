import { test, expect } from '@playwright/test'

test('create 1 rectangle', async ({ page }) => {
	await page.goto('http://localhost:4000/')
	await page.getByRole('spinbutton', { name: 'X-position' }).click()
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowDown')
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowDown')
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowDown')
	await page.getByRole('spinbutton', { name: 'X-position' }).press('ArrowDown')
	await page.getByRole('button', { name: 'Create Rectangles' }).click()
})

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
