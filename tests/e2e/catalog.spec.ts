import { expect, test } from '@playwright/test'
import { callApi, openApp, useScenario } from './support/mock-api'
import { catalogCardNames, resultCount, toggleFilter, waitForCatalogIdle } from './support/ui'

test.describe('catálogo da Início', () => {
  test('mostra os cards do Figma na página 1 e pagina pela URL', async ({ page }) => {
    await openApp(page)
    await expect(resultCount(page)).toHaveText('47 NFTs encontrados')
    expect((await catalogCardNames(page)).slice(0, 3)).toEqual(['Emerald Ape #042', 'Sage Nomad #089', 'Noir Vessel #552'])

    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/[?&]pagina=2/)
    await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
    expect(await catalogCardNames(page)).not.toContain('Emerald Ape #042')
  })

  test('filtros combinados ficam na URL, refletem a API e reiniciam a paginação', async ({ page, isMobile }) => {
    await openApp(page, '/?pagina=2')
    await toggleFilter(page, isMobile, 'Música')
    await expect(page).toHaveURL(/colecao=musica/)
    await expect(page).not.toHaveURL(/pagina=/)

    await toggleFilter(page, isMobile, 'Polygon')
    await expect(page).toHaveURL(/colecao=musica&rede=polygon/)

    const api = await callApi<{ items: { name: string }[]; totalItems: number }>(
      page,
      '/nfts?collection=musica&network=polygon',
    )
    await expect(resultCount(page)).toHaveText(new RegExp(`^${api.body.totalItems} NFTs? encontrados?$`))
    expect(await catalogCardNames(page)).toEqual(api.body.items.map((item) => item.name))
  })

  test('voltar, avançar e refresh restauram busca, filtro e ordenação', async ({ page, isMobile }) => {
    await openApp(page, '/?colecao=musica')
    await expect(resultCount(page)).toBeVisible()
    const sort = page.getByLabel('Ordenar por:')
    await sort.selectOption('preco-desc')
    await expect(page).toHaveURL(/ordem=preco-desc/)
    await waitForCatalogIdle(page)
    const sortedNames = await catalogCardNames(page)

    await page.goBack()
    await expect(page).toHaveURL(/\?colecao=musica$/)
    await expect(sort).toHaveValue('recentes')

    await page.goForward()
    await expect(sort).toHaveValue('preco-desc')
    await expect.poll(() => catalogCardNames(page)).toEqual(sortedNames)

    await page.reload()
    await expect(sort).toHaveValue('preco-desc')
    if (!isMobile) await expect(page.getByRole('checkbox', { name: /^Música/ })).toBeChecked()
    await expect.poll(() => catalogCardNames(page)).toEqual(sortedNames)
  })

  test('busca (header no desktop, topo no mobile) vira ?q= e mostra estado vazio com "Limpar filtros"', async ({ page, isMobile }) => {
    await openApp(page)
    if (isMobile) {
      // Início mobile (Figma): campo "Explorar coleções" no topo.
      await page.getByRole('searchbox', { name: 'Buscar NFTs' }).fill('golden')
    } else {
      await page.getByRole('button', { name: 'Buscar NFTs' }).click()
      await page.getByRole('dialog', { name: 'Buscar NFTs' }).getByLabel('Termo de busca').fill('golden')
    }
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/q=golden/)
    await waitForCatalogIdle(page)
    await expect(page.getByText('Busca: “golden”')).toBeVisible()
    expect(await catalogCardNames(page)).toEqual(
      expect.arrayContaining(['Golden Beat #207', 'Golden Groove #031', 'Golden Signal #160']),
    )
    for (const name of await catalogCardNames(page)) expect(name.toLowerCase()).toContain('golden')

    await page.goto('/?q=nada-por-aqui')
    await expect(page.getByText('Nenhum NFT encontrado.')).toBeVisible()
    await page.getByRole('link', { name: 'Limpar filtros' }).click()
    await expect(resultCount(page)).toHaveText('47 NFTs encontrados')
  })

  test('respostas fora de ordem não sobrescrevem o filtro mais recente', async ({ page, isMobile }) => {
    test.skip(isMobile, 'mesma lógica no mobile; o drawer só acrescenta tempo')
    await useScenario(page, 'fora-de-ordem')
    await openApp(page)
    await expect(resultCount(page)).toBeVisible()

    // A 1ª busca nova é lenta (1,8 s) e a 2ª rápida (0,2 s): a lenta chega por último.
    await toggleFilter(page, false, 'Música')
    await toggleFilter(page, false, 'Arte 3D')
    await expect(page).toHaveURL(/colecao=musica,arte-3d/)
    await page.waitForTimeout(2200)
    await waitForCatalogIdle(page)

    const expected = await callApi<{ items: { name: string }[] }>(page, '/nfts?collection=musica&collection=arte-3d')
    expect(await catalogCardNames(page)).toEqual(expected.body.items.map((item) => item.name))
  })

  test('falha mostra erro e "Tentar novamente" recupera', async ({ page }) => {
    await useScenario(page, 'erro-500')
    await openApp(page)
    const alert = page.locator('#catalogo').getByRole('alert')
    await expect(alert).toContainText('Não foi possível carregar o catálogo', { timeout: 15_000 })

    await page.evaluate(() => window.__kurioMock?.setScenario('default'))
    await alert.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(resultCount(page)).toHaveText('47 NFTs encontrados')
  })

  test('skeleton com shimmer durante carregamento lento e estático com movimento reduzido', async ({ page }) => {
    await useScenario(page, 'lento')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await openApp(page)
    const skeleton = page.locator('#catalogo div[aria-busy="true"] [data-slot="skeleton"]').first()
    await expect(page.locator('#catalogo').getByRole('status').filter({ hasText: 'Carregando catálogo' })).toBeAttached()
    await expect(skeleton).toBeVisible()
    expect(await skeleton.evaluate((element) => getComputedStyle(element).animationName)).toBe('shimmer')

    await page.emulateMedia({ reducedMotion: 'reduce' })
    expect(await skeleton.evaluate((element) => getComputedStyle(element).animationName)).toBe('none')

    await expect(resultCount(page)).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('#catalogo [data-slot="skeleton"]')).toHaveCount(0)
  })
})
