import { defineConfig } from '@playwright/test'
import base from './playwright.config'

/**
 * Regressão visual (`npm run test:visual`). Fica fora do `test:e2e` porque as
 * capturas dependem do sistema operacional (fonte e antialiasing): as
 * baselines versionadas foram geradas no Windows. Em outro sistema, gere as
 * suas com `npm run test:visual:update` antes de comparar.
 */
export default defineConfig({
  ...base,
  testDir: './tests/visual',
  // Sem o sufixo de plataforma: uma baseline por tela e projeto, versionada no repositório.
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  expect: {
    ...base.expect,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      // Tolera ruído de antialiasing; uma mudança real de layout passa disso com folga.
      maxDiffPixelRatio: 0.01,
    },
  },
})
