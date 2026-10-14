/**
 * Auditoria Lighthouse (`npm run lighthouse`). Configuração em ./config.mjs.
 *
 * 1. Gera o build otimizado e sobe o `vite preview`.
 * 2. Roda o Lighthouse 3× por página e perfil, cada vez num Chrome novo
 *    (o Chromium instalado pelo Playwright, para não depender de Chrome no sistema).
 * 3. Salva HTML e JSON de cada medição em lighthouse/reports/ e escreve
 *    lighthouse/RESULTADOS.md e lighthouse/summary.json com as medianas,
 *    LCP/CLS/TBT, versões das ferramentas e o ambiente.
 *
 * `--skip-build` reaproveita o dist/ existente.
 */
import { execSync, spawn } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import { CATEGORIES, FORM_FACTORS, METRICS, PAGES, PREVIEW_PORT, RUNS, TARGETS } from './config.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REPORTS_DIR = path.join(ROOT, 'lighthouse', 'reports')
const BASE_URL = `http://localhost:${PREVIEW_PORT}`

function log(message) {
  console.log(`[lighthouse] ${message}`)
}

async function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // ainda subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  throw new Error(`O preview não respondeu em ${url}`)
}

function startPreview() {
  // Comando único (sem lista de argumentos): no Windows o `npx` precisa do shell.
  const child = spawn(`npx vite preview --port ${PREVIEW_PORT} --strictPort`, { cwd: ROOT, shell: true, stdio: 'ignore' })
  return child
}

function stopPreview(child) {
  if (child.exitCode !== null) return
  if (process.platform === 'win32') {
    // No Windows, o `npx` abre um processo filho; encerra a árvore inteira.
    try {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' })
    } catch {
      // já encerrado
    }
  } else {
    child.kill('SIGTERM')
  }
}

/**
 * O Lighthouse às vezes perde a conexão com o Chrome ("Target closed") dentro de
 * um handler de evento, fora da promessa da auditoria: o erro chega como
 * rejeição não tratada. Ela é convertida em falha desta medição (que é repetida).
 */
function audit(url, formFactor) {
  return new Promise((resolve, reject) => {
    const onStray = (reason) => reject(reason instanceof Error ? reason : new Error(String(reason)))
    process.once('unhandledRejection', onStray)
    runAudit(url, formFactor)
      .then(resolve, reject)
      .finally(() => process.off('unhandledRejection', onStray))
  })
}

async function runAudit(url, formFactor) {
  const chrome = await chromeLauncher.launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check'],
  })
  try {
    const flags = { port: chrome.port, output: ['html', 'json'], logLevel: 'error', onlyCategories: CATEGORIES }
    const result = await lighthouse(url, flags, formFactor === 'desktop' ? desktopConfig : undefined)
    if (!result) throw new Error(`Lighthouse sem resultado para ${url}`)
    const [html, json] = result.report
    return { lhr: result.lhr, html, json }
  } finally {
    await chrome.kill()
  }
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function formatMetric(metric, value) {
  if (metric.id === 'cumulative-layout-shift') return value.toFixed(3)
  return `${Math.round(value)} ms`
}

function writeSummary(results, environment) {
  const rows = []
  const summary = { environment, targets: TARGETS, results: [] }

  for (const page of PAGES) {
    for (const formFactor of FORM_FACTORS) {
      const runs = results.filter((item) => item.page.id === page.id && item.formFactor === formFactor)
      const scores = Object.fromEntries(
        CATEGORIES.map((category) => [category, median(runs.map((run) => Math.round(run.lhr.categories[category].score * 100)))]),
      )
      const metrics = Object.fromEntries(
        METRICS.map((metric) => [metric.label, median(runs.map((run) => run.lhr.audits[metric.id].numericValue))]),
      )
      const perRun = runs.map((run) => ({
        file: run.file,
        scores: Object.fromEntries(CATEGORIES.map((category) => [category, Math.round(run.lhr.categories[category].score * 100)])),
        metrics: Object.fromEntries(METRICS.map((metric) => [metric.label, run.lhr.audits[metric.id].numericValue])),
      }))
      summary.results.push({ page: page.name, path: page.path, formFactor, median: { scores, metrics }, runs: perRun })

      const cell = (category) => `${scores[category]}${scores[category] < TARGETS[category] ? ' ⚠️' : ''}`
      rows.push(
        `| ${page.name} | ${formFactor} | ${CATEGORIES.map(cell).join(' | ')} | ${METRICS.map((metric) => formatMetric(metric, metrics[metric.label])).join(' | ')} |`,
      )
    }
  }

  const markdown = `# Resultados do Lighthouse

Gerado por \`npm run lighthouse\` em ${environment.date}. Mediana de ${RUNS} medições por página e perfil; ⚠️ = abaixo da meta.

| Página | Perfil | Performance (≥ ${TARGETS.performance}) | Accessibility (≥ ${TARGETS.accessibility}) | Best Practices (≥ ${TARGETS['best-practices']}) | SEO (≥ ${TARGETS.seo}) | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
${rows.join('\n')}

## Ambiente e condições

| Item | Valor |
|---|---|
| Lighthouse | ${environment.lighthouse} |
| Navegador | ${environment.browser} |
| Node.js | ${environment.node} |
| Sistema | ${environment.os} |
| CPU | ${environment.cpu} |
| Memória | ${environment.memory} |
| Servidor | \`vite preview\` (build otimizado), ${BASE_URL} |
| Mocks | Ativos, cenário padrão (MSW + Socket.IO simulado) |
| Perfil mobile | Preset padrão do Lighthouse: Moto G Power, 4G lento simulado, CPU 4× |
| Perfil desktop | Preset de desktop do Lighthouse: 1350 × 940, rede rápida simulada, sem limite de CPU |
| Medições | ${RUNS} por página e perfil, cada uma num Chrome novo e sem cache (primeira visita) |

Relatórios HTML e JSON de cada medição em \`lighthouse/reports/\`. Configuração versionada em \`lighthouse/config.mjs\`.

**Causas do que ficou abaixo das metas e o que foi testado:** [ANALISE.md](ANALISE.md).
`
  writeFileSync(path.join(ROOT, 'lighthouse', 'RESULTADOS.md'), markdown)
  writeFileSync(path.join(ROOT, 'lighthouse', 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
  console.log(`\n${rows.join('\n')}\n`)
}

async function main() {
  if (!process.argv.includes('--skip-build')) {
    log('Gerando o build otimizado…')
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' })
  }

  rmSync(REPORTS_DIR, { recursive: true, force: true })
  mkdirSync(REPORTS_DIR, { recursive: true })

  log(`Subindo o preview em ${BASE_URL}…`)
  const preview = startPreview()
  const results = []
  let browserVersion = ''
  let lighthouseVersion = ''

  try {
    await waitForServer(BASE_URL)
    for (const page of PAGES) {
      for (const formFactor of FORM_FACTORS) {
        for (let run = 1; run <= RUNS; run += 1) {
          log(`${page.name} · ${formFactor} · medição ${run}/${RUNS}`)
          let outcome
          try {
            outcome = await audit(`${BASE_URL}${page.path}`, formFactor)
          } catch (error) {
            // Queda da conexão com o Chrome (rara): repete a medição uma vez, registrando o motivo.
            log(`medição falhou (${error instanceof Error ? error.message : error}); repetindo uma vez`)
            outcome = await audit(`${BASE_URL}${page.path}`, formFactor)
          }
          const { lhr, html, json } = outcome
          const file = `${page.id}-${formFactor}-${run}`
          writeFileSync(path.join(REPORTS_DIR, `${file}.report.html`), html)
          writeFileSync(path.join(REPORTS_DIR, `${file}.report.json`), json)
          if (lhr.runtimeError) throw new Error(`${file}: ${lhr.runtimeError.message}`)
          browserVersion = lhr.environment.hostUserAgent
          lighthouseVersion = lhr.lighthouseVersion
          results.push({ page, formFactor, lhr, file })
        }
      }
    }
  } finally {
    stopPreview(preview)
  }

  writeSummary(results, {
    date: new Date().toISOString(),
    lighthouse: lighthouseVersion,
    browser: browserVersion,
    node: process.version,
    os: `${os.type()} ${os.release()} (${os.arch()})`,
    cpu: `${os.cpus()[0]?.model ?? 'desconhecida'} · ${os.cpus().length} núcleos`,
    memory: `${Math.round(os.totalmem() / 1024 ** 3)} GB`,
  })
  log('Pronto: lighthouse/RESULTADOS.md, lighthouse/summary.json e lighthouse/reports/.')
}

main().catch((error) => {
  console.error('[lighthouse] Falhou:', error)
  process.exit(1)
})
