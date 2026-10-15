import { expect, test, type Page } from '@playwright/test'
import { openApp, useScenario } from './support/mock-api'
import { loginViaUi } from './support/ui'

/**
 * Botão de favorito do detalhe: no desktop, "Favoritar"/"Favoritado" (Figma 10:244);
 * no mobile, o coração do topo (Figma 15:5536), com o nome do NFT no rótulo.
 */
function favoriteButton(page: Page, isMobile: boolean, state: 'off' | 'on', name = 'Noir Vessel #552') {
  if (!isMobile) return page.getByRole('button', { name: state === 'off' ? 'Favoritar' : 'Favoritado', exact: true })
  return page
    .getByRole('main')
    .getByRole('button', { name: state === 'off' ? `Favoritar ${name}` : `Remover ${name} dos favoritos`, exact: true })
    .first()
}

test.describe('favoritos', () => {
  test('visitante: o login abre sobre o NFT e, depois de entrar, continua na mesma página', async ({ page, isMobile }) => {
    await openApp(page, '/nft/nft-003')
    await favoriteButton(page, isMobile, 'off').click()

    const dialog = page.getByRole('dialog', { name: 'Entrar' })
    await expect(dialog).toBeVisible()
    await expect(page).toHaveURL(/\/nft\/nft-003$/)
    await dialog.getByLabel('E-mail').fill('ana@kurio.dev')
    await dialog.getByLabel('Senha', { exact: true }).fill('Kurio@123')
    await dialog.getByRole('button', { name: 'Entrar' }).click()
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/nft\/nft-003$/)
    await expect(favoriteButton(page, isMobile, 'off')).toBeVisible()
  })

  test('favoritar é otimista, persiste após refresh e aparece em "Meus favoritos"', async ({ page, isMobile }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/nft/nft-003')
    const button = favoriteButton(page, isMobile, 'off')
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await button.click()
    await expect(favoriteButton(page, isMobile, 'on')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('status').filter({ hasText: 'foi adicionado aos favoritos' })).toBeVisible()

    await page.reload()
    await expect(favoriteButton(page, isMobile, 'on')).toHaveAttribute('aria-pressed', 'true')

    await page.goto('/favoritos')
    await expect(page.getByRole('heading', { name: 'Meus favoritos' })).toBeVisible()
    await expect(page.locator('main article h3')).toContainText(['Emerald Ape #042', 'Cosmic Bloom #118', 'Noir Vessel #552'])
  })

  test('falha na mutation desfaz a mudança otimista e avisa', async ({ page, isMobile }) => {
    await useScenario(page, 'favorito-falha')
    await loginViaUi(page, 'ana@kurio.dev', '/nft/nft-003')
    await favoriteButton(page, isMobile, 'off').click()

    // Otimista: muda na hora...
    await expect(favoriteButton(page, isMobile, 'on')).toHaveAttribute('aria-pressed', 'true')
    // ...e volta quando a API falha.
    await expect(favoriteButton(page, isMobile, 'off')).toHaveAttribute('aria-pressed', 'false')
    await expect(
      page.getByRole('status').filter({ hasText: 'Não foi possível favoritar "Noir Vessel #552". A alteração foi desfeita.' }),
    ).toBeVisible()
  })

  test('favoritos de um usuário não aparecem para outro', async ({ page }) => {
    await loginViaUi(page, 'bruno@kurio.dev', '/favoritos')
    await expect(page.locator('main article h3')).toHaveText(['Golden Beat #207'])
  })
})
