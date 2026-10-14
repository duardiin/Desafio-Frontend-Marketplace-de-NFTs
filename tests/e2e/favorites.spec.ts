import { expect, test } from '@playwright/test'
import { openApp, useScenario } from './support/mock-api'
import { loginViaUi } from './support/ui'

test.describe('favoritos', () => {
  test('visitante é levado ao login e volta para o NFT', async ({ page }) => {
    await openApp(page, '/nft/nft-003')
    await page.getByRole('button', { name: 'Favoritar', exact: true }).click()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fnft%2Fnft-003/)

    const dialog = page.getByRole('dialog', { name: 'Entrar' })
    await dialog.getByLabel('E-mail').fill('ana@kurio.dev')
    await dialog.getByLabel('Senha').fill('Kurio@123')
    await dialog.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/nft\/nft-003$/)
  })

  test('favoritar é otimista, persiste após refresh e aparece em "Meus favoritos"', async ({ page }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/nft/nft-003')
    const button = page.getByRole('button', { name: 'Favoritar', exact: true })
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await button.click()
    await expect(page.getByRole('button', { name: 'Favoritado', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('status').filter({ hasText: 'foi adicionado aos favoritos' })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('button', { name: 'Favoritado', exact: true })).toHaveAttribute('aria-pressed', 'true')

    await page.goto('/favoritos')
    await expect(page.getByRole('heading', { name: 'Meus favoritos' })).toBeVisible()
    await expect(page.locator('main article h3')).toContainText(['Emerald Ape #042', 'Cosmic Bloom #118', 'Noir Vessel #552'])
  })

  test('falha na mutation desfaz a mudança otimista e avisa', async ({ page }) => {
    await useScenario(page, 'favorito-falha')
    await loginViaUi(page, 'ana@kurio.dev', '/nft/nft-003')
    await page.getByRole('button', { name: 'Favoritar', exact: true }).click()

    // Otimista: muda na hora...
    await expect(page.getByRole('button', { name: 'Favoritado', exact: true })).toHaveAttribute('aria-pressed', 'true')
    // ...e volta quando a API falha.
    await expect(page.getByRole('button', { name: 'Favoritar', exact: true })).toHaveAttribute('aria-pressed', 'false')
    await expect(
      page.getByRole('status').filter({ hasText: 'Não foi possível favoritar "Noir Vessel #552". A alteração foi desfeita.' }),
    ).toBeVisible()
  })

  test('favoritos de um usuário não aparecem para outro', async ({ page }) => {
    await loginViaUi(page, 'bruno@kurio.dev', '/favoritos')
    await expect(page.locator('main article h3')).toHaveText(['Golden Beat #207'])
  })
})
