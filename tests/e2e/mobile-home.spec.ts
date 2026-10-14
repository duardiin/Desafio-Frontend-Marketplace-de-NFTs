import { expect, test } from '@playwright/test'
import { openApp } from './support/mock-api'
import { loginViaUi, waitForCatalogIdle } from './support/ui'

/** Início mobile do Figma (14:5226): busca no topo, hero compacto, grade desencontrada e tab bar. */
test.skip(({ isMobile }) => !isMobile, 'layout exclusivo abaixo de 768 px')

test.describe('Início mobile', () => {
  test('sem header: busca e filtros no topo; tab bar com o Início ativo e botão central só visual', async ({ page }) => {
    await openApp(page)
    await expect(page.getByRole('banner')).toBeHidden()
    await expect(page.getByRole('searchbox', { name: 'Buscar NFTs' })).toHaveAttribute('placeholder', 'Explorar coleções')

    const tabBar = page.getByRole('navigation', { name: 'Atalhos' })
    await expect(tabBar.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page')
    // Botão central sem função definida: nada focável além dos 4 atalhos.
    await expect(tabBar.getByRole('link')).toHaveCount(4)
    await expect(tabBar.getByRole('button')).toHaveCount(0)

    // As outras telas mantêm o header.
    await tabBar.getByRole('link', { name: /^Carrinho/ }).click()
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(tabBar.getByRole('link', { name: /^Carrinho/ })).toHaveAttribute('aria-current', 'page')
  })

  test('o botão de filtros do topo abre o drawer e mostra quantos filtros estão ativos', async ({ page }) => {
    await openApp(page)
    await page.getByRole('button', { name: 'Filtros', exact: true }).click()
    const drawer = page.getByRole('dialog', { name: 'Filtros' })
    await drawer.locator('label').filter({ hasText: 'Música' }).click()
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(page).toHaveURL(/colecao=musica/)
    await expect(page.getByRole('button', { name: 'Filtros 1 ativos' })).toBeVisible()
  })

  test('a busca do topo mantém os filtros e sobrevive ao refresh', async ({ page }) => {
    await openApp(page, '/?rede=ethereum')
    const field = page.getByRole('searchbox', { name: 'Buscar NFTs' })
    await field.fill('golden')
    await field.press('Enter')
    await expect(page).toHaveURL(/q=golden/)
    await expect(page).toHaveURL(/rede=ethereum/)
    await page.reload()
    await expect(page.getByRole('searchbox', { name: 'Buscar NFTs' })).toHaveValue('golden')
  })

  test('cards com selo RARO e favorito; atalhos da conta exigem login e o carrinho mostra a contagem', async ({ page }) => {
    await openApp(page)
    await waitForCatalogIdle(page)
    const card = page.locator('#catalogo article').filter({ hasText: 'Emerald Ape #042' })
    await expect(card.getByText('RARO', { exact: true })).toBeVisible()
    await expect(card.getByRole('button', { name: 'Favoritar Emerald Ape #042' })).toBeVisible()

    await page.getByRole('navigation', { name: 'Atalhos' }).getByRole('link', { name: 'Favoritos' }).click()
    await expect(page).toHaveURL(/\/login\?redirect=%2Ffavoritos/)

    await loginViaUi(page, 'ana@kurio.dev', '/')
    await expect(page.getByRole('navigation', { name: 'Atalhos' }).getByRole('link', { name: 'Carrinho, 1 item' })).toBeVisible()
  })
})
