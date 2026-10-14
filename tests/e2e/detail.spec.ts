import { expect, test } from '@playwright/test'
import { openApp, useScenario } from './support/mock-api'

test.describe('detalhe do NFT', () => {
  test('acesso direto, edição indisponível e limite de quantidade por edição', async ({ page, isMobile }) => {
    await openApp(page, '/nft/nft-001')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    if (!isMobile) {
      await expect(page.getByRole('banner').getByRole('link', { name: 'Mercado' })).toHaveClass(/text-highlight/)
    }

    // 1/1 está esgotada: indisponível; a primeira edição disponível vem selecionada.
    await expect(page.getByRole('radio', { name: '1/1 (esgotada)' })).toBeDisabled()
    await expect(page.getByRole('radio', { name: '1/10' })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByText('4 de 10 disponíveis · máximo de 5 por pedido')).toBeVisible()

    const plus = page.getByRole('button', { name: 'Aumentar quantidade' })
    const quantity = page.getByRole('group', { name: 'Quantidade' }).locator('output')
    for (let i = 0; i < 3; i++) await plus.click()
    await expect(quantity).toHaveText('4')
    await expect(plus).toBeDisabled()

    // Outra edição: URL própria, quantidade reinicia e o limite passa a ser o por pedido.
    await page.getByRole('radio', { name: '1/50' }).click()
    await expect(page).toHaveURL(/edicao=1-50/)
    await expect(quantity).toHaveText('1')
    for (let i = 0; i < 4; i++) await plus.click()
    await expect(quantity).toHaveText('5')
    await expect(plus).toBeDisabled()

    await page.reload()
    await expect(page.getByRole('radio', { name: '1/50' })).toHaveAttribute('aria-checked', 'true')
  })

  test('NFT inexistente mostra página própria com volta ao início', async ({ page }) => {
    await openApp(page, '/nft/nft-999')
    await expect(page.getByRole('heading', { level: 1, name: 'NFT não encontrado' })).toBeVisible()
    await page.getByRole('link', { name: 'Voltar ao início' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('NFT com todas as edições esgotadas não permite escolher quantidade', async ({ page }) => {
    await openApp(page, '/nft/nft-044')
    await expect(page.getByText('Todas as edições estão esgotadas.')).toBeVisible()
    for (const radio of await page.getByRole('radio').all()) await expect(radio).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()
  })

  test('galeria troca a imagem e o zoom abre em diálogo com foco controlado', async ({ page }) => {
    await openApp(page, '/nft/nft-001')
    await page.getByRole('button', { name: 'Ver imagem 3 de 4' }).click()
    await expect(page.getByRole('button', { name: 'Ver imagem 3 de 4' })).toHaveAttribute('aria-pressed', 'true')

    const zoom = page.getByRole('button', { name: 'Ampliar imagem' })
    await zoom.click()
    const dialog = page.getByRole('dialog', { name: 'Emerald Ape #042' })
    await expect(dialog.getByRole('img')).toHaveAttribute('alt', /vista 3 de 4/)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(zoom).toBeFocused()
  })

  test('abas de informações funcionam pelo teclado', async ({ page }) => {
    await openApp(page, '/nft/nft-001')
    const details = page.getByRole('tab', { name: 'Detalhes do NFT' })
    await details.focus()
    await page.keyboard.press('ArrowRight')
    const reviews = page.getByRole('tab', { name: /Avaliações de colecionadores/ })
    await expect(reviews).toBeFocused()
    await expect(reviews).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tabpanel')).toContainText('avaliações mais recentes')
  })

  test('skeleton aparece no carregamento lento sem deslocar o layout', async ({ page }) => {
    await useScenario(page, 'lento')
    await openApp(page, '/')
    await page.goto('/nft/nft-002')
    await expect(page.getByRole('status').filter({ hasText: 'Carregando NFT' })).toBeAttached()
    await expect(page.getByRole('heading', { level: 1, name: 'Sage Nomad #089' })).toBeVisible({ timeout: 10_000 })
  })
})
