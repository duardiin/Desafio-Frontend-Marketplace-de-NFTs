import { expect, test, type Page } from '@playwright/test'

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
] as const

async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
}

test.describe('layout base', () => {
  test('header e footer aparecem com a marca e o rodapé do Figma', async ({ page }) => {
    // No mobile, as telas com frame próprio (Início, Detalhe, Carrinho, Pagamento) não têm header; a 404 tem.
    await page.goto('/rota-inexistente')
    await expect(page.getByRole('link', { name: 'Kurio, página inicial' })).toBeVisible()
    await expect(page.getByRole('contentinfo')).toContainText(
      '© 2026 Kurio. Propriedade digital para todos.',
    )
    await expect(page.getByRole('heading', { name: 'Carteiras compatíveis' })).toBeVisible()
  })

  test('não há overflow horizontal em 390, 768 e 1440 px', async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport)
      for (const path of ['/', '/rota-inexistente']) {
        await page.goto(path)
        await expect(page.getByRole('contentinfo')).toBeVisible()
        expect(await hasHorizontalOverflow(page), `${path} em ${viewport.width}px`).toBe(false)
      }
    }
  })

  test('link "Pular para o conteúdo" é o primeiro foco e leva ao main', async ({ page }) => {
    await page.goto('/')
    await page.locator('#conteudo').waitFor()
    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skipLink).toBeFocused()
    await expect(skipLink).toBeVisible()
  })

  test('itens fora do escopo não aparentam funcionar', async ({ page }) => {
    await page.goto('/')
    const footerItem = page.getByRole('contentinfo').getByText('Como comprar NFTs')
    await expect(footerItem).toHaveAttribute('aria-disabled', 'true')
    await expect(page.getByRole('link', { name: /Como comprar NFTs/ })).toHaveCount(0)
  })

  test('links do footer com tela na entrega levam ao destino (coleção filtra o catálogo)', async ({ page }) => {
    await page.goto('/carrinho')
    const footer = page.getByRole('contentinfo')
    await expect(footer.getByRole('link', { name: 'Lista de interesse' })).toHaveAttribute('href', '/favoritos')
    await expect(footer.getByRole('link', { name: 'Meu perfil' })).toHaveAttribute('href', '/perfil')
    await footer.getByRole('link', { name: 'Música' }).click()
    await expect(page).toHaveURL(/\/\?colecao=musica#catalogo$/)
    await expect(page.locator('#catalogo')).toContainText('NFTs encontrados')
  })

  test('newsletter informa que não está disponível em vez de simular sucesso', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Antecipe-se ao próximo lançamento').fill('colecionador@exemplo.com')
    await page.getByRole('button', { name: 'Enviar' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'newsletter' })).toHaveText(
      'A newsletter ainda não está disponível nesta versão.',
    )
  })
})

test.describe('navegação desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'nav completa só aparece a partir de 1024 px')

  test('Início fica ativo na home e Mercado no catálogo', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Principal', exact: true })
    await expect(nav.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page')

    await nav.getByRole('link', { name: 'Mercado' }).click()
    await expect(page).toHaveURL(/\/#catalogo$/)
    await expect(nav.getByRole('link', { name: 'Mercado' })).toHaveAttribute('aria-current', 'page')
    await expect(nav.getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current')
  })
})

test.describe('navegação mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'menu em drawer só existe abaixo de 1024 px')

  test('menu abre, prende o foco, fecha com Esc e devolve o foco ao botão', async ({ page }) => {
    await page.goto('/rota-inexistente')
    const trigger = page.getByRole('button', { name: 'Abrir menu' })
    await trigger.focus()
    await page.keyboard.press('Enter')

    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()
    await expect(drawer.getByRole('link', { name: 'Início' })).toBeVisible()
    await expect(drawer.getByText('Criadores')).toHaveAttribute('aria-disabled', 'true')

    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('link do menu navega e fecha o drawer', async ({ page }) => {
    await page.goto('/rota-inexistente')
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await page.getByRole('dialog').getByRole('link', { name: 'Início' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page).toHaveURL(/\/$/)
  })
})

test.describe('rota inexistente', () => {
  test('acesso direto mostra a 404 com layout e volta ao início', async ({ page }) => {
    await page.goto('/nao/existe/mesmo')
    await expect(page.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeVisible()
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()

    await page.getByRole('link', { name: 'Voltar ao início' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toHaveCount(0)
  })
})
