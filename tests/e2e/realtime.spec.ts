import { expect, test, type Page } from '@playwright/test'
import { callApi, openApp } from './support/mock-api'
import { loginViaUi } from './support/ui'

/**
 * Tempo real: todos os eventos passam pelo socket.io-client (servidor Socket.IO
 * simulado pelo MSW). Os controles `__kurioMock` só mudam o "servidor" ou a
 * conexão; nenhum teste escreve no cache do app.
 */
test.skip(({ isMobile }) => isMobile, 'lógica de tempo real não depende do viewport')

async function waitForSocket(page: Page, userId: string | null) {
  await expect
    .poll(() => page.evaluate(() => window.__kurioMock?.realtime.connections().map((item) => item.userId) ?? []))
    .toEqual([userId])
}

async function ordersOf(page: Page) {
  const token = await page.evaluate(() => localStorage.getItem('kurio:session-token'))
  const result = await callApi<{ items: unknown[] }>(page, '/orders', { token: token ?? '' })
  return result.body.items
}

test.describe('tempo real', () => {
  test('detalhe: preço e disponibilidade ao vivo; evento antigo não regride o estado', async ({ page }) => {
    await openApp(page, '/nft/nft-001')
    await waitForSocket(page, null)
    const main = page.getByRole('main')

    await page.evaluate(() => window.__kurioMock?.updateNft('nft-001', { priceEth: '2.50' }))
    await expect(main).toContainText('Preço: 2.50 ETH')

    // Evento atrasado (versão anterior) com outro preço: ignorado.
    await page.evaluate(() => window.__kurioMock?.realtime.emitStale('nft-001', '0.10'))
    await page.waitForTimeout(500)
    await expect(main).toContainText('Preço: 2.50 ETH')
    await expect(main).not.toContainText('0.10 ETH')

    await page.evaluate(() => window.__kurioMock?.updateNft('nft-001', { available: 0, editionId: '1-10' }))
    await expect(page.getByRole('radio', { name: '1/10 (esgotada)' })).toBeDisabled()
  })

  test('catálogo: o card muda de preço sem recarregar', async ({ page }) => {
    await openApp(page)
    await waitForSocket(page, null)
    const card = page.locator('#catalogo article').filter({ hasText: 'Sage Nomad #089' })
    await expect(card).toContainText('1.69 ETH')
    await page.evaluate(() => window.__kurioMock?.updateNft('nft-002', { priceEth: '1.79' }))
    await expect(card).toContainText('1.79 ETH')
  })

  test('cenário 1: preço muda no checkout, a interface avisa, o resumo atualiza e a cotação antiga é bloqueada', async ({ page }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/pagamento')
    await waitForSocket(page, 'usr-ana')
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(page.getByText('Conectada', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revise seu pedido' })
    await expect(review).toContainText('1.6921 ETH')

    // O "servidor" muda o preço com o item no carrinho e a revisão aberta.
    await page.evaluate(() => window.__kurioMock?.updateNft('nft-002', { priceEth: '1.79' }))
    const notice = page.getByRole('status').filter({ hasText: 'O preço de "Sage Nomad #089" mudou: 1.69 ETH → 1.79 ETH' })
    await expect(notice).toBeVisible()
    // Seletor CSS: com a revisão (modal) aberta, o resto da página fica aria-hidden.
    await expect(page.locator('section[aria-labelledby="seus-nfts-titulo"]')).toContainText('1.7921 ETH')

    // Evento duplicado não repete o aviso.
    await page.evaluate(() => window.__kurioMock?.realtime.replayLast())
    await page.waitForTimeout(500)
    await expect(notice).toHaveCount(1)

    // A revisão aberta tinha a cotação antiga: confirmar exige nova confirmação.
    await review.getByRole('button', { name: 'Confirmar pagamento' }).click()
    await expect(review.getByText('Os valores do pedido mudaram.')).toBeVisible()
    await review.getByRole('button', { name: 'Confirmar novos valores' }).click()
    await expect(page.getByRole('dialog', { name: 'Pedido confirmado' })).toContainText('1.7921 ETH', { timeout: 15_000 })
  })

  test('cenário 2: conexão cai com pedido pendente e a retomada reconcilia sem nova compra', async ({ page }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/pagamento')
    await waitForSocket(page, 'usr-ana')
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(page.getByText('Conectada', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await page.getByRole('dialog', { name: 'Revise seu pedido' }).getByRole('button', { name: 'Confirmar pagamento' }).click()
    await expect(page.getByRole('heading', { name: 'Aguardando confirmação' })).toBeVisible()

    // A conexão cai antes da confirmação (≈2,5 s) e só volta depois dela: o evento se perde.
    await page.evaluate(() => window.__kurioMock?.realtime.goOffline(4000))
    await expect(page.getByRole('status').filter({ hasText: 'Conexão em tempo real perdida' })).toBeVisible()

    // Ao reconectar, a reconciliação pelo REST mostra o pedido confirmado.
    await expect(page.getByRole('status').filter({ hasText: 'Conexão em tempo real restabelecida' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('dialog', { name: 'Pedido confirmado' })).toBeVisible()
    expect(await ordersOf(page)).toHaveLength(1)
  })

  test('logout e troca de usuário encerram o socket anterior (sem eventos da sessão passada)', async ({ page }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/')
    await waitForSocket(page, 'usr-ana')

    await page.getByRole('button', { name: /menu da conta/ }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await waitForSocket(page, null)

    await loginViaUi(page, 'bruno@kurio.dev', '/')
    await waitForSocket(page, 'usr-bruno')
  })
})
