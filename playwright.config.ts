import { defineConfig, devices } from '@playwright/test'

const PORT = 5173
const BASE_URL = `http://localhost:${PORT}`

/**
 * E2E funcionais (`npm run test:e2e`): desktop e mobile, relatório HTML,
 * trace e captura nas falhas. A regressão visual tem configuração própria
 * (playwright.visual.config.ts), que herda esta.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  // Com vários workers contra o servidor de desenvolvimento, 5 s (padrão) ficou justo em máquinas mais lentas.
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Timeout curto do cliente HTTP para os cenários de timeout não demorarem 10 s.
    env: { VITE_HTTP_TIMEOUT_MS: '3000' },
  },
})
