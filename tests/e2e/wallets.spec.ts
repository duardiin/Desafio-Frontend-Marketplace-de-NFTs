import { expect, test, type Page } from '@playwright/test'
import { loginViaUi } from './support/ui'

function walletCard(page: Page, label: string) {
  return page.getByRole('article', { name: label })
}

test.describe('carteiras', () => {
  test('lista principal e secundária; "Tornar principal" troca os papéis e persiste', async ({ page }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/carteiras')
    await expect(walletCard(page, 'Carteira principal')).toContainText('Principal')
    await expect(walletCard(page, 'Carteira Solana')).toContainText('Secundária')
    // Limite atingido: não dá para cadastrar uma terceira.
    await expect(page.getByRole('button', { name: 'Adicionar carteira' })).toBeDisabled()

    await walletCard(page, 'Carteira Solana').getByRole('button', { name: /Tornar principal/ }).click()
    await expect(page.getByRole('status').filter({ hasText: '"Carteira Solana" agora é a carteira principal.' })).toBeVisible()

    await page.reload()
    await expect(walletCard(page, 'Carteira Solana')).toContainText('Principal')
    await expect(walletCard(page, 'Carteira principal')).toContainText('Secundária')
    // A principal vem primeiro.
    await expect(page.getByRole('article').first()).toHaveAccessibleName('Carteira Solana')
  })

  test('cadastro valida redes e endereço e persiste após refresh', async ({ page }) => {
    await loginViaUi(page, 'bruno@kurio.dev', '/carteiras')
    await page.getByRole('button', { name: 'Adicionar carteira' }).click()
    const dialog = page.getByRole('dialog', { name: 'Adicionar carteira' })
    // Bruno já tem a principal: o papel livre vem marcado.
    await expect(dialog.getByRole('radio', { name: 'Secundária' })).toBeChecked()

    await dialog.getByRole('button', { name: 'Adicionar carteira' }).click()
    await expect(dialog.getByLabel('Rótulo')).toHaveAccessibleDescription(/Informe o rótulo/)
    await expect(dialog.getByText('Selecione pelo menos uma rede.')).toBeVisible()

    await dialog.getByLabel('Rótulo').fill('Cofre Solana')
    await dialog.getByLabel('Provedor').selectOption('coinbase')
    await dialog.getByRole('checkbox', { name: 'Solana' }).check()
    await dialog.getByRole('checkbox', { name: 'Ethereum' }).check()
    await dialog.getByLabel('Endereço').fill('0x123')
    await dialog.getByRole('button', { name: 'Adicionar carteira' }).click()
    await expect(dialog.getByText('Solana não pode ser combinada com redes EVM na mesma carteira.')).toBeVisible()
    await expect(dialog.getByLabel('Endereço')).toHaveAccessibleDescription(/Endereço Solana inválido/)

    await dialog.getByRole('checkbox', { name: 'Ethereum' }).uncheck()
    await dialog.getByLabel('Endereço').fill('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin')
    await dialog.getByRole('button', { name: 'Adicionar carteira' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('status').filter({ hasText: 'Carteira "Cofre Solana" cadastrada.' })).toBeVisible()

    await page.reload()
    await expect(walletCard(page, 'Cofre Solana')).toContainText('Secundária')
    await expect(walletCard(page, 'Cofre Solana')).toContainText('Coinbase · Solana')
  })

  test('erro da API (limite de carteiras) aparece no formulário', async ({ page }) => {
    await loginViaUi(page, 'bruno@kurio.dev', '/carteiras')
    await page.getByRole('button', { name: 'Adicionar carteira' }).click()
    const dialog = page.getByRole('dialog', { name: 'Adicionar carteira' })
    await dialog.getByLabel('Rótulo').fill('Outra principal')
    await dialog.getByLabel('Provedor').selectOption('metamask')
    await dialog.getByRole('checkbox', { name: 'Ethereum' }).check()
    await dialog.getByLabel('Endereço').fill('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
    // A principal já existe: a API recusa (409 WALLET_LIMIT).
    await dialog.locator('label').filter({ hasText: 'Principal' }).click()
    await dialog.getByRole('button', { name: 'Adicionar carteira' }).click()
    await expect(dialog.getByRole('alert')).toContainText('Você já tem uma carteira principal. Edite a existente.')
  })

  test('edição salva e o pagamento leva às carteiras em "Usar outra carteira?"', async ({ page }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/carteiras')
    await walletCard(page, 'Carteira principal').getByRole('button', { name: /Editar/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Editar carteira' })
    await dialog.getByLabel('Rótulo').fill('MetaMask da Ana')
    await dialog.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(dialog).toBeHidden()
    await expect(walletCard(page, 'MetaMask da Ana')).toBeVisible()

    await page.goto('/pagamento')
    await page.getByRole('link', { name: 'Usar outra carteira?' }).click()
    await expect(page).toHaveURL(/\/carteiras$/)
    await expect(walletCard(page, 'MetaMask da Ana')).toBeVisible()
  })
})
