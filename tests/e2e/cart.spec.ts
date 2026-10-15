import { expect, test, type Page } from '@playwright/test'
import { openApp } from './support/mock-api'
import { loginViaUi } from './support/ui'

/** Adiciona pelo detalhe (edição selecionada por padrão ou a pedida) e espera abrir o carrinho. */
async function buyFromDetail(page: Page, nftId: string, { edition, extra = 0 }: { edition?: string; extra?: number } = {}) {
  await openApp(page, `/nft/${nftId}${edition ? `?edicao=${edition}` : ''}`)
  for (let i = 0; i < extra; i++) await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  // "COMPRAR" no desktop (Figma 10:244) e "Comprar NFT" no mobile (15:5536): ambos abrem o carrinho.
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
}

function summaryValue(page: Page, label: string | RegExp) {
  return page
    .getByRole('region', { name: 'Resumo do pedido' })
    .locator('div')
    .filter({ has: page.getByText(label, { exact: typeof label === 'string' }) })
    .locator('dd')
    .last()
}

/**
 * Contagem de itens: no desktop, o badge do header; no mobile (sem header no
 * Carrinho, Figma 16:360), o total anunciado na própria tela.
 */
async function expectItemCount(page: Page, isMobile: boolean, count: number) {
  const label = count === 0 ? 'vazio' : `${count} ${count === 1 ? 'item' : 'itens'}`
  if (isMobile) {
    if (count === 0) await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
    else await expect(page.getByRole('main').getByText(label, { exact: true })).toBeAttached()
    return
  }
  await expect(page.getByRole('banner').getByRole('link', { name: /^Carrinho/ })).toHaveAccessibleName(`Carrinho, ${label}`)
}

test.describe('carrinho', () => {
  test('visitante compra pelo detalhe: edição, quantidade, badge e totais da cotação', async ({ page, isMobile }) => {
    await buyFromDetail(page, 'nft-001', { extra: 1 })
    await expect(page.getByRole('heading', { level: 3, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.getByText(isMobile ? 'Edição: 1/10' : 'Edição 1/10 · 1.19 ETH cada')).toBeVisible()
    await expectItemCount(page, isMobile, 2)

    await expect(summaryValue(page, 'Subtotal')).toHaveText('2.38 ETH')
    // No mobile, a taxa vem com a nota "Taxa estimada" (Figma 16:360).
    await expect(summaryValue(page, 'Taxa de rede')).toContainText('0.0021 ETH')
    await expect(summaryValue(page, 'Total')).toHaveText('2.3821 ETH')
  })

  test('quantidade respeita o limite da edição e remover esvazia o carrinho', async ({ page, isMobile }) => {
    // Golden Beat #207, edição 1/10: 6 disponíveis, máximo de 5 por pedido.
    await buyFromDetail(page, 'nft-007', { edition: '1-10' })
    const plus = page.getByRole('button', { name: 'Aumentar quantidade de Golden Beat #207' })
    const quantity = page.getByRole('group', { name: 'Quantidade de Golden Beat #207' }).locator('output')
    // Cada clique salva na API; o próximo só depois da resposta.
    for (let expected = 2; expected <= 5; expected++) {
      await plus.click()
      await expect(quantity).toHaveText(String(expected))
    }
    await expect(plus).toBeDisabled()
    await expect(summaryValue(page, 'Subtotal')).toHaveText('4.95 ETH')

    await page.getByRole('button', { name: /Remover Golden Beat #207 do carrinho/ }).click()
    await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
    await expectItemCount(page, isMobile, 0)
  })

  test('cupom inválido e expirado no campo; válido aplica desconto exato e pode ser removido', async ({ page }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/carrinho')
    const coupon = page.getByLabel('Cupom de desconto')

    await coupon.fill('EXPIRADO')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(coupon).toHaveAccessibleDescription('Este cupom expirou.')

    await coupon.fill('XYZ')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(coupon).toHaveAccessibleDescription('Cupom inválido. Confira o código.')

    await coupon.fill('kurio10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('Cupom KURIO10 aplicado', { exact: true })).toBeVisible()
    // "− 0.169 ETH" no desktop; "(-) 0.169 ETH" no mobile, como no Figma.
    await expect(summaryValue(page, /^Desconto/)).toHaveText(/^(− |\(-\) )0\.169 ETH$/)
    await expect(summaryValue(page, 'Total')).toHaveText('1.5231 ETH')

    await page.getByRole('button', { name: 'Remover cupom' }).click()
    await expect(summaryValue(page, 'Total')).toHaveText('1.6921 ETH')
  })

  test('carrinho do visitante sobrevive ao refresh e é preservado ao entrar na conta', async ({ page }) => {
    await buyFromDetail(page, 'nft-007', { edition: '1-10' })
    await page.reload()
    await expect(page.getByRole('heading', { level: 3, name: 'Golden Beat #207' })).toBeVisible()

    await loginViaUi(page, 'ana@kurio.dev', '/carrinho')
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(page.getByRole('status').filter({ hasText: 'escolheu antes de entrar' })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Itens do carrinho' }).getByRole('heading', { level: 3 })).toHaveText([
      'Sage Nomad #089',
      'Golden Beat #207',
    ])

    await page.reload()
    await expect(page.getByRole('heading', { level: 3, name: 'Golden Beat #207' })).toBeVisible()
  })

  test('cada usuário vê só o próprio carrinho', async ({ page }) => {
    await loginViaUi(page, 'bruno@kurio.dev', '/carrinho')
    await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
    await expect(page.getByText('Sage Nomad #089')).toHaveCount(0)
  })

  test('mudança de preço e edição esgotada são sinalizadas e bloqueiam a revisão', async ({ page }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/carrinho')
    await expect(summaryValue(page, 'Subtotal')).toHaveText('1.69 ETH')

    // Mudança "do servidor" (API simulada); refletida pela API ao recarregar.
    await page.evaluate(() => window.__kurioMock?.updateNft('nft-002', { priceEth: '1.79' }))
    await page.reload()
    await expect(page.getByText('era 1.69 ETH quando você adicionou, agora é 1.79 ETH.')).toBeVisible()
    await expect(summaryValue(page, 'Subtotal')).toHaveText('1.79 ETH')

    await page.evaluate(() => window.__kurioMock?.updateNft('nft-002', { available: 0 }))
    await page.reload()
    await expect(page.getByText('esta edição esgotou. Remova o item para continuar.')).toBeVisible()
    await expect(page.getByRole('alert').filter({ hasText: 'Revise o carrinho' })).toBeVisible()
  })
})
