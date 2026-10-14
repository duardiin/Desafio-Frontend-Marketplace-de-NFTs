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

export async function startMocks() {
  applyUrlOptions()

  const { worker } = await import('@/mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: import.meta.env.PROD,
    serviceWorker: { url: '/mockServiceWorker.js' },
  })

  const { startRealtimeEvents, realtimeControls } = await import('@/mocks/realtime')
  startRealtimeEvents()
  resumePendingOrders()
  exposeMockControls(realtimeControls)

  if (!import.meta.env.PROD) console.info(`[mocks] Cenário ativo: ${getActiveScenario()}`)
}
