import { test, expect } from '@playwright/test'

test('plugin UI opens and displays expected content', async ({ page }) => {
	await page.goto('http://localhost:3000') // replace with your plugin dev server URL

	await expect(page.getByText('Your Plugin Title')).toBeVisible()
	await expect(page.locator('button:has-text("Do something")')).toBeEnabled()

	await page.click('button:has-text("Do something")')
	await expect(page.getByText('Action complete')).toBeVisible()
})
