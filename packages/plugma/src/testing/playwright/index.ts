import { test as pwTest, expect as pwExpect, Page } from '@playwright/test'
import { main } from './main.js'

export const test = pwTest.extend<{ ui: Page; main: any }>({
	ui: async ({ page }: { page: Page }, use: (page: Page) => Promise<void>) => {
		await use(page)
	},
	main: async ({}, use: (main: any) => Promise<void>) => {
		await use(main)
	},
})

export const describe = pwTest.describe
export const expect = pwExpect
