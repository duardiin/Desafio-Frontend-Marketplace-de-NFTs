import { expect, test, type Page } from '@playwright/test'
import { openApp, useScenario } from './support/mock-api'

/** E-mail exibido no formulário do perfil (campo editável). */
function profileEmail(page: Page) {
  return page.getByRole('main').getByRole('textbox', { name: 'E-mail', exact: true })
}

const PASSWORD = 'Kurio@123'

/** Abre o login pelo header (desktop) ou pelo menu (mobile). */
async function openLoginFromHeader(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await page.getByRole('dialog').getByRole('link', { name: 'Entrar' }).click()
  } else {
    await page.getByRole('banner').getByRole('link', { name: 'Entrar' }).click()
  }
  await expect(page.getByRole('dialog', { name: 'Entrar' })).toBeVisible()
}

async function fillLogin(page: Page, email: string, password = PASSWORD) {
  const dialog = page.getByRole('dialog', { name: 'Entrar' })
  await dialog.getByLabel('E-mail').fill(email)
  await dialog.getByLabel('Senha').fill(password)
  await dialog.getByRole('button', { name: 'Entrar' }).click()
}

async function logout(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Sair' }).click()
  } else {
    await page.getByRole('button', { name: /menu da conta/ }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
  }
  await expect(page.getByRole('status').filter({ hasText: 'Você saiu da sua conta.' })).toBeVisible()
}

/** Indicador de sessão visível no header (desktop) ou no menu (mobile). */
async function expectSignedInAs(page: Page, firstName: string, isMobile: boolean) {
  if (isMobile) {
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await expect(page.getByRole('dialog')).toContainText(`Conectado como ${firstName}`)
    await page.keyboard.press('Escape')
  } else {
    await expect(page.getByRole('button', { name: /menu da conta/ })).toContainText(firstName)
  }
}

test.describe('login', () => {
  test('valida campos, mostra erro da API e mantém a sessão após o refresh', async ({ page, isMobile }) => {
    await openApp(page)
    await openLoginFromHeader(page, isMobile)
    const dialog = page.getByRole('dialog', { name: 'Entrar' })

    // Validação no cliente, com erro associado ao campo.
    await dialog.getByRole('button', { name: 'Entrar' }).click()
    const email = dialog.getByLabel('E-mail')
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toHaveAccessibleDescription('Informe seu e-mail.')
    await expect(email).toBeFocused()

    // Erro devolvido pela API.
    await fillLogin(page, 'ana@kurio.dev', 'senhaerrada1')
    await expect(dialog.getByRole('alert')).toContainText('E-mail ou senha incorretos.')

    await fillLogin(page, 'ana@kurio.dev')
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('status').filter({ hasText: 'Olá, Ana!' })).toBeVisible()
    await expectSignedInAs(page, 'Ana', isMobile)

    await page.reload()
    await page.getByRole('banner').waitFor()
    await expectSignedInAs(page, 'Ana', isMobile)
  })

  test('Esc fecha o modal e devolve a tela anterior', async ({ page, isMobile }) => {
    await openApp(page)
    await openLoginFromHeader(page, isMobile)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Entrar' })).toBeHidden()
    await expect(page).toHaveURL(/\/$/)
  })
})

test.describe('cadastro', () => {
  test('conflito de e-mail vindo da API fica no campo; cadastro novo entra na conta', async ({ page, isMobile }) => {
    await openApp(page, '/cadastro')
    const dialog = page.getByRole('dialog', { name: 'Criar conta' })
    await dialog.getByLabel('Nome').fill('Carla Souza')
    await dialog.getByLabel('E-mail').fill('ana@kurio.dev')
    await dialog.getByLabel('Senha', { exact: true }).fill('Segredo123')
    await dialog.getByLabel('Confirmar senha').fill('Segredo321')
    await dialog.getByRole('button', { name: 'Criar conta' }).click()
    await expect(dialog.getByLabel('Confirmar senha')).toHaveAccessibleDescription('As senhas não conferem.')

    await dialog.getByLabel('Confirmar senha').fill('Segredo123')
    await dialog.getByRole('button', { name: 'Criar conta' }).click()
    const emailField = dialog.getByLabel('E-mail')
    await expect(emailField).toHaveAccessibleDescription(/já está cadastrado/)
    await expect(emailField).toBeFocused()

    await emailField.fill('carla@kurio.dev')
    await dialog.getByRole('button', { name: 'Criar conta' }).click()
    await expect(dialog).toBeHidden()
    await expectSignedInAs(page, 'Carla', isMobile)
  })
})

test.describe('rotas protegidas', () => {
  test('acesso direto sem sessão leva ao login e volta para a tela pedida', async ({ page }) => {
    await openApp(page, '/perfil')
    await expect(page).toHaveURL(/\/login\?redirect=%2Fperfil/)
    await fillLogin(page, 'bruno@kurio.dev')
    await expect(page).toHaveURL(/\/perfil$/)
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
    await expect(profileEmail(page)).toHaveValue('bruno@kurio.dev')
  })

  test('quem já está autenticado não vê o login', async ({ page }) => {
    await openApp(page, '/login?redirect=%2Fperfil')
    await fillLogin(page, 'ana@kurio.dev')
    await expect(page).toHaveURL(/\/perfil$/)
    await page.goto('/login')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('dialog', { name: 'Entrar' })).toHaveCount(0)
  })
})

test.describe('expiração da sessão', () => {
  test('durante a navegação: avisa, leva ao login e retoma a tela', async ({ page }) => {
    await openApp(page, '/login?redirect=%2Fperfil')
    await fillLogin(page, 'ana@kurio.dev')
    await expect(profileEmail(page)).toHaveValue('ana@kurio.dev')

    await page.evaluate(() => window.__kurioMock?.expireSessions())
    // Navegar para outra rota privada revalida a sessão.
    await page.getByRole('link', { name: 'Kurio, página inicial' }).click()
    await page.goto('/perfil')

    await expect(page).toHaveURL(/\/login\?redirect=%2Fperfil&motivo=expirada/)
    await expect(page.getByRole('dialog', { name: 'Entrar' })).toContainText('Sua sessão expirou')
    await fillLogin(page, 'ana@kurio.dev')
    await expect(page).toHaveURL(/\/perfil$/)
  })

  test('com a tela aberta: ao vencer o prazo, encerra a sessão e leva ao login', async ({ page }) => {
    await useScenario(page, 'sessao-expirada') // sessões novas valem 30 s
    await page.clock.install()
    await openApp(page, '/login?redirect=%2Fperfil')
    await fillLogin(page, 'ana@kurio.dev')
    await expect(profileEmail(page)).toHaveValue('ana@kurio.dev')

    await page.clock.fastForward('00:35')

    await expect(page).toHaveURL(/\/login\?redirect=%2Fperfil&motivo=expirada/)
    await expect(page.getByRole('status').filter({ hasText: 'Sua sessão expirou' }).first()).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('kurio:session-token'))).toBeNull()
  })

  test('no carregamento: token expirado não abre a área privada', async ({ page }) => {
    await openApp(page, '/login?redirect=%2Fperfil')
    await fillLogin(page, 'ana@kurio.dev')
    await expect(profileEmail(page)).toHaveValue('ana@kurio.dev')

    await page.evaluate(() => window.__kurioMock?.expireSessions())
    await page.reload()

    await expect(page).toHaveURL(/\/login\?redirect=%2Fperfil&motivo=expirada/)
    await expect(profileEmail(page)).toHaveCount(0)
  })
})

test.describe('logout e troca de usuário', () => {
  test('logout limpa os dados privados e a troca de usuário não mostra dados do anterior', async ({ page, isMobile }) => {
    await openApp(page, '/login?redirect=%2Fperfil')
    await fillLogin(page, 'ana@kurio.dev')
    await expect(profileEmail(page)).toHaveValue('ana@kurio.dev')

    await logout(page, isMobile)
    await expect(page).toHaveURL(/\/$/)
    expect(await page.evaluate(() => localStorage.getItem('kurio:session-token'))).toBeNull()

    // Sem sessão, a área privada volta a exigir login.
    await page.goto('/perfil')
    await expect(page).toHaveURL(/\/login/)
    await fillLogin(page, 'bruno@kurio.dev')
    await expect(profileEmail(page)).toHaveValue('bruno@kurio.dev')
    await expect(page.getByText('Ana Ribeiro')).toHaveCount(0)
  })
})
