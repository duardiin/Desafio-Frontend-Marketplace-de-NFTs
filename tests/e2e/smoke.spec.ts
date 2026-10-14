import { expect, test } from '@playwright/test'

test('a aplicação carrega sem overflow horizontal', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('NFT Marketplace')

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
})
