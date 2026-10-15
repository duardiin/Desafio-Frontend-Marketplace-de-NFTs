import { expect, test } from '@playwright/test'
import { openApp } from './support/mock-api'

/**
 * Aba em segundo plano por um tempo: o navegador encerra o service worker
 * ocioso, e o MSW perde a lista (em memória) das abas que usam os mocks. Ao
 * voltar para a aba, as requisições não podem ir para a rede real (que
 * responde com o HTML do site) nem quebrar a tela.
 */
test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'usa o protocolo do Chrome; lógica independe do viewport')

test('voltar à aba depois de o navegador encerrar o service worker mantém o app funcionando', async ({ page }) => {
  await openApp(page)
  await expect(page.locator('#catalogo article').first()).toBeVisible()

  // Simula o navegador encerrando o service worker ocioso.
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('ServiceWorker.enable')
  await cdp.send('ServiceWorker.stopAllWorkers')

  // A pessoa volta para a aba e continua navegando.
  await page.evaluate(() => {
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('focus'))
  })

  // Navegação dentro do app (sem recarregar): o detalhe vem da API simulada.
  await page.locator('#catalogo article').filter({ hasText: 'Sage Nomad #089' }).getByRole('link').click()
  await expect(page.getByRole('heading', { level: 1, name: 'Sage Nomad #089' })).toBeVisible()
  await expect(page.getByText(/Algo deu errado|não encontrado/i)).toHaveCount(0)

  // E uma escrita: adicionar ao carrinho chega à API simulada.
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
  await expect(page.getByRole('heading', { level: 3, name: 'Sage Nomad #089' })).toBeVisible()
})
