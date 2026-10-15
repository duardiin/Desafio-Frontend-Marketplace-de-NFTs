import { expect, test, type Page } from '@playwright/test'
import { callApi, openApp, useScenario } from './support/mock-api'
import { loginViaUi } from './support/ui'

async function sessionToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => localStorage.getItem('kurio:session-token'))
  if (!token) throw new Error('sem sessão')
  return token
}

async function ordersOf(page: Page) {
  const result = await callApi<{ items: { id: string; status: string }[] }>(page, '/orders', { token: await sessionToken(page) })
  return result.body.items
}

async function connectWallet(page: Page) {
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Conectada', { exact: true })).toBeVisible()
}

/** Abre a revisão (valida o formulário e revalida a cotação). */
async function openReview(page: Page) {
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const dialog = page.getByRole('dialog', { name: 'Revise seu pedido' })
  await expect(dialog).toBeVisible()
  return dialog
}

async function expectConfirmed(page: Page) {
  await expect(page).toHaveURL(/\/pedidos\/ord-/)
  await expect(page.getByRole('dialog', { name: 'Pedido confirmado' })).toBeVisible({ timeout: 15_000 })
}

test.describe('pagamento e pedido', () => {
  test('compra completa: catálogo, carrinho, login, pagamento, revisão e recibo confirmado', async ({ page }) => {
    // Visitante escolhe uma edição e vai ao carrinho.
    await openApp(page, '/nft/nft-007?edicao=1-10')
    await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
    await expect(page.getByRole('heading', { level: 3, name: 'Golden Beat #207' })).toBeVisible()
    await page.getByRole('link', { name: /^(Finalizar compra|Conectar e finalizar)$/ }).click()

    // Pagamento é privado: login e volta, com os itens do visitante preservados.
    await expect(page).toHaveURL(/\/login\?redirect=%2Fpagamento/)
    const login = page.getByRole('dialog', { name: 'Entrar' })
    await login.getByLabel('E-mail').fill('ana@kurio.dev')
    await login.getByLabel('Senha', { exact: true }).fill('Kurio@123')
    await login.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/pagamento$/)

    const summary = page.getByRole('region', { name: 'Seus NFTs' })
    await expect(summary.getByText('Golden Beat #207')).toBeVisible()
    await expect(summary.getByText('Sage Nomad #089')).toBeVisible()
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Ribeiro')

    await connectWallet(page)
    const review = await openReview(page)
    await expect(review).toContainText('2.6842 ETH') // 1.69 + 0.99 + 2 linhas × 0.0021
    await review.getByRole('button', { name: 'Confirmar pagamento' }).click()

    await expect(page).toHaveURL(/\/pedidos\/ord-/)
    await expect(page.getByRole('heading', { name: 'Aguardando confirmação' })).toBeVisible()
    await expectConfirmed(page)
    const confirmation = page.getByRole('dialog', { name: 'Pedido confirmado' })
    await expect(confirmation).toContainText('2.6842 ETH')
    await expect(confirmation.getByRole('link', { name: /ver referência simulada/ })).toBeVisible()

    // Só o que foi comprado sai do carrinho (aqui: tudo).
    await page.goto('/carrinho')
    await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
  })

  test('valida os campos do layout com erros associados', async ({ page }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/pagamento')
    const name = page.getByLabel('Nome de exibição')
    await name.fill('')
    await page.getByLabel('Código de indicação').fill('x!')
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    await expect(name).toHaveAccessibleDescription('Informe seu nome de exibição.')
    await expect(name).toBeFocused()
    await expect(page.getByLabel('Código de indicação')).toHaveAccessibleDescription('Use de 4 a 12 letras ou números.')
    await expect(page.getByRole('dialog', { name: 'Revise seu pedido' })).toHaveCount(0)
  })

  test('pagamento recusado mostra o motivo e preserva o carrinho', async ({ page }) => {
    await useScenario(page, 'pagamento-recusado')
    await loginViaUi(page, 'ana@kurio.dev', '/pagamento')
    await connectWallet(page)
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar pagamento' }).click()

    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Pagamento recusado pela carteira.')).toBeVisible()
    await page.goto('/carrinho')
    await expect(page.getByRole('heading', { level: 3, name: 'Sage Nomad #089' })).toBeVisible()
  })

  test('clique repetido gera um único pedido', async ({ page }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/pagamento')
    await connectWallet(page)
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar pagamento' }).dblclick()
    await expectConfirmed(page)
    expect(await ordersOf(page)).toHaveLength(1)
  })

  test('timeout na criação: "Tentar de novo" recupera o mesmo pedido', async ({ page }) => {
    await useScenario(page, 'pedido-timeout')
    await loginViaUi(page, 'ana@kurio.dev', '/pagamento')
    await connectWallet(page)
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar pagamento' }).click()

    await expect(review.getByText('Não recebemos a confirmação do pedido.')).toBeVisible({ timeout: 15_000 })
    await review.getByRole('button', { name: 'Tentar de novo' }).click()
    await expectConfirmed(page)
    expect(await ordersOf(page)).toHaveLength(1)
  })

  test('preço alterado na confirmação exige nova confirmação', async ({ page }) => {
    await useScenario(page, 'preco-alterado')
    await loginViaUi(page, 'ana@kurio.dev', '/pagamento')
    await connectWallet(page)
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar pagamento' }).click()

    await expect(review.getByText('Os valores do pedido mudaram.')).toBeVisible()
    await expect(review).toContainText('Sage Nomad #089: 1.69 ETH → 1.79 ETH')
    await review.getByRole('button', { name: 'Confirmar novos valores' }).click()
    await expectConfirmed(page)
    await expect(page.getByRole('dialog', { name: 'Pedido confirmado' })).toContainText('1.7921 ETH')
  })

  test('carteira recusada não conecta e explica o motivo', async ({ page }) => {
    await useScenario(page, 'carteira-recusada')
    await loginViaUi(page, 'ana@kurio.dev', '/pagamento')
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'A conexão foi recusada na carteira.' })).toBeVisible()
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Conecte a carteira para continuar.' })).toBeVisible()
  })

  test('carteira desconectada no envio: reconectar e concluir sem pedido duplicado', async ({ page }) => {
    await useScenario(page, 'carteira-desconectada')
    await loginViaUi(page, 'ana@kurio.dev', '/pagamento')
    await connectWallet(page)
    let review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar pagamento' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'A conexão com a carteira caiu' })).toBeVisible()
    await connectWallet(page)
    review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar pagamento' }).click()
    await expectConfirmed(page)
    expect(await ordersOf(page)).toHaveLength(1)
  })

  test('refresh com pedido pendente retoma o acompanhamento', async ({ page }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/pagamento')
    await connectWallet(page)
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar pagamento' }).click()
    await expect(page.getByRole('heading', { name: 'Aguardando confirmação' })).toBeVisible()

    await page.reload()
    await expectConfirmed(page)
    expect(await ordersOf(page)).toHaveLength(1)
  })

  test('sessão expirada no pagamento: login e retomada com o rascunho', async ({ page }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/pagamento')
    await page.getByLabel('Nome do perfil').fill('Ana Colecionadora')
    await page.evaluate(() => window.__kurioMock?.expireSessions())

    // Qualquer chamada privada detecta a expiração: o clique ou um refetch da página,
    // o que vier primeiro. Se o app já levou ao login, o clique não é necessário.
    await page
      .getByRole('button', { name: 'Conectar carteira' })
      .click({ timeout: 3000 })
      .catch(() => undefined)
    await expect(page).toHaveURL(/\/login\?redirect=%2Fpagamento&motivo=expirada/)
    const login = page.getByRole('dialog', { name: 'Entrar' })
    await login.getByLabel('E-mail').fill('ana@kurio.dev')
    await login.getByLabel('Senha', { exact: true }).fill('Kurio@123')
    await login.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/pagamento$/)
    await expect(page.getByLabel('Nome do perfil')).toHaveValue('Ana Colecionadora')
  })
})
