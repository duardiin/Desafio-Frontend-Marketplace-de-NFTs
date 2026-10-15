import { expect, test, type Page } from '@playwright/test'
import { openApp, placeOrderAsAna } from './support/mock-api'
import { loginViaUi } from './support/ui'

/**
 * Varredura de responsividade: todas as telas em 390 (projeto mobile, com
 * `isMobile`) e em 768 e 1440 (projeto desktop), sem overflow horizontal.
 *
 * Com `isMobile`, o Chrome alarga a viewport de layout para caber o conteúdo
 * (a página "encolhe" em vez de rolar). Por isso também se compara
 * `innerWidth` com a largura pedida: um overflow escondido por
 * `overflow-x: clip` ainda apareceria ali.
 *
 * `SHOTS_DIR` (opcional) salva capturas de página inteira para revisão manual.
 */
const SHOTS_DIR = process.env.SHOTS_DIR

async function expectNoOverflow(page: Page, label: string, width: number) {
  // Espera o conteúdo assentar (skeletons, imagens com dimensões reservadas).
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    // Elementos que passam da borda direita (fora dos que rolam por dentro, como a faixa da conta).
    offenders: [...document.body.querySelectorAll<HTMLElement>('*')]
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        if (rect.width === 0 || rect.right <= document.documentElement.clientWidth + 1) return false
        let parent = element.parentElement
        while (parent) {
          const overflow = getComputedStyle(parent).overflowX
          if (overflow === 'auto' || overflow === 'scroll' || overflow === 'hidden' || overflow === 'clip') return false
          parent = parent.parentElement
        }
        return true
      })
      .slice(0, 5)
      .map((element) => `${element.tagName.toLowerCase()}.${String(element.className).slice(0, 60)}`),
  }))
  const detail = `${label} em ${width}px: ${JSON.stringify(metrics)}`
  expect(metrics.innerWidth, detail).toBe(width)
  expect(metrics.scrollWidth, detail).toBeLessThanOrEqual(metrics.clientWidth)
  expect(metrics.offenders, detail).toEqual([])
  if (SHOTS_DIR) {
    await page.screenshot({ path: `${SHOTS_DIR}/${width}${label.replace(/[^a-z0-9-]+/gi, '_')}.png`, fullPage: true })
  }
}

async function scan(page: Page, paths: string[], widths: number[]) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 })
    for (const path of paths) {
      await page.goto(path)
      await page.locator('#conteudo').waitFor()
      await expectNoOverflow(page, path, width)
    }
  }
}

test('todas as telas sem overflow horizontal em 390, 768 e 1440 px', async ({ page, isMobile }) => {
  test.setTimeout(120_000)
  const widths = isMobile ? [390] : [768, 1440]

  await openApp(page)
  await scan(page, ['/', '/?pagina=2&rede=ethereum', '/nft/nft-001', '/nft/nft-999', '/carrinho', '/login', '/cadastro', '/rota-inexistente'], widths)

  await loginViaUi(page, 'ana@kurio.dev', '/')
  await scan(page, ['/perfil', '/carteiras', '/favoritos', '/carrinho', '/pagamento'], widths)

  // Pedido confirmado (modal de confirmação) e recibo da transação.
  const orderId = await placeOrderAsAna(page, 'responsivo-1')

  for (const width of widths) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 })
    await page.goto(`/pedidos/${orderId}`)
    const dialog = page.getByRole('dialog', { name: 'Pedido confirmado' })
    await expect(dialog).toBeVisible({ timeout: 15_000 })
    await expectNoOverflow(page, `/pedidos/confirmado`, width)

    const hash = await page.locator('a[href^="/transacoes/"]').first().getAttribute('href')
    if (hash) {
      await page.goto(hash)
      await page.locator('#conteudo').waitFor()
      await expectNoOverflow(page, '/transacoes', width)
    }
  }
})

/**
 * Zoom de 200% num monitor de 1280 × 900 (enunciado, seção 8: sem perda de
 * conteúdo com zoom). Para o navegador, equivale a uma janela de 640 × 450 px
 * CSS com densidade 2. O conteúdo reflui sem overflow, e as ações principais
 * continuam visíveis e utilizáveis.
 */
test.describe('zoom de 200%', () => {
  test.skip(({ isMobile }) => isMobile, 'o projeto mobile já cobre 390 px (e a tab bar de 320 a 414 px)')
  test.use({ viewport: { width: 640, height: 450 }, deviceScaleFactor: 2 })

  test('telas principais sem overflow e com as ações ao alcance', async ({ page }) => {
    test.setTimeout(90_000)
    await openApp(page)
    await expectNoOverflow(page, '/ (zoom 200%)', 640)
    await expect(page.getByRole('searchbox', { name: 'Buscar NFTs' })).toBeVisible()

    await page.goto('/nft/nft-001')
    await expectNoOverflow(page, '/nft/nft-001 (zoom 200%)', 640)
    await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
    await expect(page).toHaveURL(/\/carrinho$/)
    await expectNoOverflow(page, '/carrinho (zoom 200%)', 640)

    await loginViaUi(page, 'ana@kurio.dev', '/pagamento')
    await expectNoOverflow(page, '/pagamento (zoom 200%)', 640)
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(page.getByText('Conectada', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revise seu pedido' })
    // Com 450 px de altura, a revisão rola por dentro: o botão é alcançável e aparece inteiro.
    const confirm = review.getByRole('button', { name: 'Confirmar pagamento' })
    await confirm.scrollIntoViewIfNeeded()
    await expect(confirm).toBeInViewport({ ratio: 1 })

    await page.keyboard.press('Escape')
    await page.goto('/perfil')
    await expectNoOverflow(page, '/perfil (zoom 200%)', 640)
    await page.goto('/carteiras')
    await expectNoOverflow(page, '/carteiras (zoom 200%)', 640)
  })
})
