import { expect, test, type Page } from '@playwright/test'
import { login, openApp } from '../e2e/support/mock-api'

/**
 * Regressão visual das telas do Figma: Início, Detalhe, Carrinho e Pagamento,
 * em desktop (1440) e mobile (390). Dados estáveis:
 * - banco simulado novo a cada teste (contexto limpo = localStorage vazio);
 * - relógio fixo (datas do blog, avaliações e expiração da sessão);
 * - sem eventos de tempo real (nenhum teste muda o "servidor");
 * - animações desligadas, fontes e imagens carregadas, avisos ocultos.
 */
const FIXED_TIME = new Date('2026-10-14T12:00:00-03:00')

// Avisos (toasts) são efêmeros: não fazem parte do layout comparado.
const HIDE_TRANSIENT = '[role="status"][aria-live] { visibility: hidden !important; }'
// Em captura de página inteira, a tab bar e as barras de ação fixas (mobile) seriam desenhadas
// no meio da página. Elas são comparadas nas capturas da primeira tela.
const HIDE_FIXED = 'nav[aria-label="Atalhos"], [data-fixed-bar] { visibility: hidden !important; }'

test.beforeEach(async ({ page }) => {
  // Só `Date` fica fixo; os timers seguem reais (MSW, socket e liquidação de pedidos dependem deles).
  await page.clock.setFixedTime(FIXED_TIME)
})

async function signInAsAna(page: Page) {
  await openApp(page)
  const token = await login(page, 'ana@kurio.dev')
  await page.evaluate((value) => localStorage.setItem('kurio:session-token', value), token)
}

/** Espera a tela assentar: dados, imagens (inclusive as lazy) e fontes. */
async function settle(page: Page) {
  await page.locator('#conteudo').waitFor()
  // Percorre a página para disparar o que carrega ao entrar na tela, e volta ao topo.
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight)
    await new Promise((resolve) => setTimeout(resolve, 300))
    window.scrollTo(0, 0)
  })
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  await page.evaluate(async () => {
    const images = [...document.images]
    for (const image of images) image.loading = 'eager'
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)))
    await document.fonts.ready
  })
}

async function capture(page: Page, name: string) {
  await settle(page)
  await page.addStyleTag({ content: HIDE_TRANSIENT + HIDE_FIXED })
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true })
}

test('Início', async ({ page }) => {
  await page.goto('/')
  await capture(page, 'inicio')
})

test('Início, primeira tela (com a tab bar no mobile)', async ({ page }) => {
  await page.goto('/')
  await settle(page)
  await page.addStyleTag({ content: HIDE_TRANSIENT })
  await expect(page).toHaveScreenshot('inicio-primeira-tela.png')
})

test('Detalhe do NFT', async ({ page }) => {
  await page.goto('/nft/nft-001')
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  await capture(page, 'detalhe')
})

test('Detalhe do NFT, primeira tela (com a barra de compra no mobile)', async ({ page }) => {
  await page.goto('/nft/nft-001')
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  await settle(page)
  await page.addStyleTag({ content: HIDE_TRANSIENT })
  await expect(page).toHaveScreenshot('detalhe-primeira-tela.png')
})

test('Carrinho', async ({ page }) => {
  await signInAsAna(page)
  await page.goto('/carrinho')
  await expect(page.getByRole('main')).toContainText('Sage Nomad #089')
  await capture(page, 'carrinho')
})

test('Pagamento', async ({ page }) => {
  await signInAsAna(page)
  await page.goto('/pagamento')
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
  await capture(page, 'pagamento')
})
