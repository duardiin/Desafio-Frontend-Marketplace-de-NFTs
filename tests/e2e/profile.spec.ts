import { expect, test, type Page } from '@playwright/test'
import { callApi } from './support/mock-api'
import { loginViaUi } from './support/ui'

/** PNG 1 × 1 válido. */
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

function field(page: Page, label: string) {
  // O rótulo dos obrigatórios termina com o asterisco (oculto para leitores de tela).
  return page.getByRole('main').getByLabel(new RegExp(`^${label}\\*?$`))
}

async function save(page: Page) {
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
}

test.describe('perfil', () => {
  test('edita os dados, o header reflete e tudo persiste após refresh', async ({ page }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/perfil')
    await expect(field(page, 'Nome de exibição')).toHaveValue('Ana Ribeiro')
    await expect(field(page, 'Nome ENS')).toHaveValue('anaribeiro')

    await field(page, 'Nome de exibição').fill('Ana R. Colecionadora')
    await field(page, 'Nome de usuário').fill('ana.coleciona')
    await field(page, 'Nome ENS').fill('ana-coleciona')
    await page.getByLabel('Domínio ENS').selectOption('box')
    await field(page, 'Apelido da carteira').fill('Cofre principal')
    await save(page)
    await expect(page.getByRole('status').filter({ hasText: 'Perfil atualizado.' })).toBeVisible()

    await page.reload()
    await expect(field(page, 'Nome de exibição')).toHaveValue('Ana R. Colecionadora')
    await expect(field(page, 'Nome de usuário')).toHaveValue('ana.coleciona')
    await expect(field(page, 'Nome ENS')).toHaveValue('ana-coleciona')
    await expect(page.getByLabel('Domínio ENS')).toHaveValue('box')
    await expect(field(page, 'Apelido da carteira')).toHaveValue('Cofre principal')
  })

  test('valida no cliente e mostra erros da API no campo (e-mail em uso)', async ({ page }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/perfil')

    await field(page, 'Nome ENS').fill('A!')
    await field(page, 'Apelido da carteira').fill('')
    await save(page)
    await expect(field(page, 'Nome ENS')).toHaveAttribute('aria-invalid', 'true')
    await expect(field(page, 'Nome ENS')).toHaveAccessibleDescription('Use de 3 a 32 letras minúsculas, números ou hífen.')
    await expect(field(page, 'Apelido da carteira')).toHaveAccessibleDescription(/Informe o apelido da carteira/)

    await field(page, 'Nome ENS').fill('anaribeiro')
    await field(page, 'Apelido da carteira').fill('Cofre da Ana')
    await field(page, 'E-mail').fill('bruno@kurio.dev')
    await save(page)
    await expect(field(page, 'E-mail')).toHaveAccessibleDescription('Este e-mail já está em uso por outra conta.')
    await expect(field(page, 'E-mail')).toBeFocused()
  })

  test('avatar: envia, aparece no header, persiste e pode ser removido; arquivo inválido é recusado', async ({ page }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/perfil')
    const fileInput = page.locator('input[type="file"]')

    await fileInput.setInputFiles({ name: 'notas.txt', mimeType: 'text/plain', buffer: Buffer.from('não é imagem') })
    await expect(page.getByRole('alert').filter({ hasText: 'Envie uma imagem PNG, JPEG ou WebP.' })).toBeVisible()

    await fileInput.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG_1PX })
    await expect(page.getByRole('status').filter({ hasText: 'Avatar atualizado.' })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()
    await expect(page.locator('header img[src^="data:image/"]').first()).toBeAttached()

    await page.getByRole('button', { name: 'Remover avatar' }).click()
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Remover avatar' })).toBeDisabled()
  })

  test('troca de senha: senha atual errada é recusada; a nova passa a valer e a antiga não', async ({ page }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/perfil')

    await field(page, 'Senha atual').fill('Errada123')
    await field(page, 'Nova senha').fill('NovaSenha9')
    await field(page, 'Confirmar nova senha').fill('NovaSenha8')
    await save(page)
    await expect(field(page, 'Confirmar nova senha')).toHaveAccessibleDescription('As senhas não conferem.')

    await field(page, 'Confirmar nova senha').fill('NovaSenha9')
    await save(page)
    await expect(field(page, 'Senha atual')).toHaveAccessibleDescription('A senha atual está incorreta.')

    // Mostrar a senha alterna o tipo do campo.
    await page.getByRole('button', { name: 'Mostrar senha atual' }).click()
    await expect(field(page, 'Senha atual')).toHaveAttribute('type', 'text')

    await field(page, 'Senha atual').fill('Kurio@123')
    await save(page)
    await expect(page.getByRole('status').filter({ hasText: 'Senha alterada.' })).toBeVisible()
    await expect(field(page, 'Senha atual')).toHaveValue('')

    const withOld = await callApi(page, '/auth/login', { method: 'POST', body: { email: 'ana@kurio.dev', password: 'Kurio@123' } })
    expect(withOld.status).toBe(422)
    const withNew = await callApi(page, '/auth/login', { method: 'POST', body: { email: 'ana@kurio.dev', password: 'NovaSenha9' } })
    expect(withNew.status).toBe(200)
  })

  test('a barra "Meu perfil" navega entre as áreas da conta e marca a atual', async ({ page }) => {
    await loginViaUi(page, 'ana@kurio.dev', '/perfil')
    const nav = page.getByRole('navigation', { name: 'Minha conta' })
    await expect(nav.getByRole('link', { name: 'Dados do perfil' })).toHaveAttribute('aria-current', 'page')
    await nav.getByRole('link', { name: 'Carteiras' }).click()
    await expect(page).toHaveURL(/\/carteiras$/)
    await expect(nav.getByRole('link', { name: 'Carteiras' })).toHaveAttribute('aria-current', 'page')
    await expect(nav.getByText('Ofertas')).toHaveAttribute('aria-disabled', 'true')
  })
})
