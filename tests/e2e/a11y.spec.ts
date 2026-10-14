import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { openApp } from './support/mock-api'
import { loginViaUi } from './support/ui'

/**
 * Verificação automática de acessibilidade (axe-core) nas telas principais,
 * em desktop e mobile: WCAG 2.0, 2.1 e 2.2 níveis A e AA, mais as boas
 * práticas do axe. Qualquer violação reprova.
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

async function expectNoViolations(page: Page, label: string) {
  // Espera skeletons e recargas terminarem.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const summary = violations.map((violation) => ({
    regra: violation.id,
    ajuda: violation.help,
    alvos: violation.nodes.slice(0, 3).map((node) => node.target.join(' ')),
  }))
  expect(summary, `${label}: ${JSON.stringify(summary, null, 2)}`).toEqual([])
}

async function auditPaths(page: Page, paths: string[]) {
  for (const path of paths) {
    await page.goto(path)
    await page.locator('#conteudo').waitFor()
    await expectNoViolations(page, path)
  }
}

test.describe('acessibilidade (axe)', () => {
  // Várias telas por teste, e o axe é pesado com a suíte em paralelo.
  test.describe.configure({ timeout: 90_000 })

  test('telas públicas', async ({ page }) => {
    await openApp(page)
    await auditPaths(page, ['/', '/nft/nft-001', '/carrinho', '/login', '/cadastro', '/rota-inexistente'])
  })

  test('telas da conta e pagamento, com diálogo de carteira aberto', async ({ page }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/')
    await auditPaths(page, ['/perfil', '/carteiras', '/favoritos', '/pagamento'])

    await page.goto('/carteiras')
    await page.getByRole('article', { name: 'Carteira principal' }).getByRole('button', { name: /Editar/ }).click()
    await expect(page.getByRole('dialog', { name: 'Editar carteira' })).toBeVisible()
    await expectNoViolations(page, '/carteiras (edição)')
  })
})
