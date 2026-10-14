import { expect, type Page } from '@playwright/test'
import { openApp } from './mock-api'

/** Entra pela tela de login (rota própria) e espera voltar ao destino. */
export async function loginViaUi(page: Page, email: string, redirect = '/') {
  await openApp(page, `/login?redirect=${encodeURIComponent(redirect)}`)
  const dialog = page.getByRole('dialog', { name: 'Entrar' })
  await dialog.getByLabel('E-mail').fill(email)
  await dialog.getByLabel('Senha').fill('Kurio@123')
  await dialog.getByRole('button', { name: 'Entrar' }).click()
  await expect(dialog).toBeHidden()
}

/**
 * Marca/desmarca um filtro do catálogo. No desktop o painel fica na sidebar;
 * no mobile abre no drawer "Filtros".
 */
export async function toggleFilter(page: Page, isMobile: boolean, label: string) {
  // O input é visualmente oculto (sr-only); clica-se no rótulo, como faz uma pessoa.
  const option = (scope: Page | ReturnType<Page['getByRole']>) =>
    scope.locator('label').filter({ has: page.getByRole('checkbox', { name: new RegExp(`^${label}`) }) })

  if (isMobile) {
    await page.getByRole('button', { name: /^Filtros/ }).click()
    const drawer = page.getByRole('dialog', { name: 'Filtros' })
    await option(drawer).click()
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
  } else {
    await option(page.getByRole('complementary', { name: 'Filtros' })).click()
  }
}

/** Nomes dos cards visíveis na grade do catálogo. */
export async function catalogCardNames(page: Page): Promise<string[]> {
  return page.locator('#catalogo article h3').allInnerTexts()
}

/** Espera o catálogo terminar de atualizar (sem a lista anterior em placeholder). */
export async function waitForCatalogIdle(page: Page) {
  await expect(page.locator('#catalogo').getByText('Atualizando…')).toHaveCount(0)
  await expect(page.locator('#catalogo ul[aria-busy="true"]')).toHaveCount(0)
}

export function resultCount(page: Page) {
  return page.locator('#catalogo').getByText(/NFTs? encontrados?$/)
}
