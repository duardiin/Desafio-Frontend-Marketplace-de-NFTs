import { exposeMockControls } from '@/mocks/controls'
import { resetDb } from '@/mocks/db/store'
import { resumePendingOrders } from '@/mocks/domain/orders'
import { getActiveScenario, isScenarioName, setActiveScenario } from '@/mocks/scenarios'

const SCENARIO_PARAM = 'cenario'
const RESET_PARAM = 'reset'

/**
 * Lê `?cenario=<nome>` e `?reset=1`, aplica e remove os parâmetros da URL
 * (para não poluírem os search params das rotas).
 */
function applyUrlOptions() {
  const url = new URL(window.location.href)
  const scenario = url.searchParams.get(SCENARIO_PARAM)
  const shouldReset = url.searchParams.has(RESET_PARAM)
  if (!scenario && !shouldReset) return

  if (scenario) {
    if (isScenarioName(scenario)) setActiveScenario(scenario)
    else console.warn(`[mocks] Cenário desconhecido "${scenario}". Usando "${getActiveScenario()}".`)
  }
  if (shouldReset) resetDb()

  url.searchParams.delete(SCENARIO_PARAM)
  url.searchParams.delete(RESET_PARAM)
  window.history.replaceState(window.history.state, '', url)
}

/** A cada 10 s com a aba visível; com a aba em segundo plano, o navegador espaça os timers. */
const REACTIVATE_INTERVAL_MS = 10_000

/**
 * Mantém esta aba registrada no service worker do MSW.
 *
 * O MSW guarda as abas que usam os mocks só na memória do service worker
 * (`activeClientIds`). Com a aba em segundo plano, o navegador encerra o
 * service worker ocioso; ele volta na próxima requisição com a lista vazia e
 * passa a mandar tudo para a rede real (na Vercel, o HTML do site). Reenviar
 * "MOCK_ACTIVATE" (a mesma mensagem que o `worker.start()` envia) ao voltar
 * para a aba, e de tempos em tempos, registra a aba de novo.
 */
function keepMocksActive() {
  const reactivate = () => navigator.serviceWorker?.controller?.postMessage('MOCK_ACTIVATE')
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') reactivate()
  })
  window.addEventListener('focus', reactivate)
  window.addEventListener('pageshow', reactivate)
  window.setInterval(() => {
    if (document.visibilityState === 'visible') reactivate()
  }, REACTIVATE_INTERVAL_MS)
}

export async function startMocks() {
  applyUrlOptions()

  const { worker } = await import('@/mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: import.meta.env.PROD,
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
  keepMocksActive()

  const { startRealtimeEvents, realtimeControls } = await import('@/mocks/realtime')
  startRealtimeEvents()
  resumePendingOrders()
  exposeMockControls(realtimeControls)

  if (!import.meta.env.PROD) console.info(`[mocks] Cenário ativo: ${getActiveScenario()}`)
}
