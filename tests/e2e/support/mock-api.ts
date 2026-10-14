import type { Page } from '@playwright/test'

export interface ApiResult<T = unknown> {
  status: number
  body: T
}

/** Define o cenário da API simulada antes de a página carregar (vale para esta aba). */
export async function useScenario(page: Page, scenario: string) {
  await page.addInitScript((name) => {
    sessionStorage.setItem('kurio:mock-scenario', name)
  }, scenario)
}

/** Abre o app e espera os mocks subirem (o render só acontece depois do worker). */
export async function openApp(page: Page, path = '/') {
  await page.goto(path)
  await page.getByRole('banner').waitFor()
}

/**
 * Chama a API simulada de dentro da página: passa pelo service worker do MSW,
 * como as chamadas do Axios. Serve para verificar contratos e estado dos mocks.
 */
export async function callApi<T = unknown>(
  page: Page,
  path: string,
  init: { method?: string; body?: unknown; token?: string; headers?: Record<string, string> } = {},
): Promise<ApiResult<T>> {
  return page.evaluate(
    async ({ path, init }) => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json', ...init.headers }
      if (init.token) headers.Authorization = `Bearer ${init.token}`
      const response = await fetch(`/api${path}`, {
        method: init.method ?? 'GET',
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      })
      const text = await response.text()
      return { status: response.status, body: text ? JSON.parse(text) : null }
    },
    { path, init },
  )
}

export async function login(page: Page, email: string, password = 'Kurio@123'): Promise<string> {
  const result = await callApi<{ token: string }>(page, '/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  if (result.status !== 200) throw new Error(`login falhou: ${result.status}`)
  return result.body.token
}
