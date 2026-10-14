import { delay, HttpResponse, type HttpResponseResolver } from 'msw'
import { apiError } from '@/mocks/lib/http'
import { createRandom } from '@/mocks/lib/random'
import { getActiveScenario } from '@/mocks/scenarios'

/** Grupos de endpoints afetados pelos cenários de rede. */
export type EndpointGroup =
  | 'auth'
  | 'catalog'
  | 'detail'
  | 'favorites'
  | 'cart'
  | 'quote'
  | 'orders'
  | 'profile'
  | 'wallets'

const DEFAULT_LATENCY_MS = 150
const SLOW_LATENCY_MS = 2500

// Contadores por carregamento da página: tornam os cenários reproduzíveis.
const requestCount = new Map<EndpointGroup, number>()
const variableLatency = createRandom(42)

function nextCount(group: EndpointGroup): number {
  const count = (requestCount.get(group) ?? 0) + 1
  requestCount.set(group, count)
  return count
}

/**
 * Aplica latência e falhas do cenário ativo. Devolve uma resposta de erro
 * quando o cenário manda falhar, ou `undefined` para seguir com o handler.
 */
async function applyNetwork(group: EndpointGroup, request: Request): Promise<Response | undefined> {
  const scenario = getActiveScenario()
  const count = nextCount(group)
  const isRead = request.method === 'GET'
  const isCatalogRead = group === 'catalog' || group === 'detail'

  switch (scenario) {
    case 'offline':
      await delay(DEFAULT_LATENCY_MS)
      return HttpResponse.error()
    case 'lento':
      await delay(SLOW_LATENCY_MS)
      return undefined
    case 'latencia-variavel':
      await delay(variableLatency.int(200, 2000))
      return undefined
    case 'fora-de-ordem':
      await delay(group === 'catalog' ? (count % 2 === 1 ? 1800 : 200) : DEFAULT_LATENCY_MS)
      return undefined
    case 'erro-500':
      await delay(DEFAULT_LATENCY_MS)
      return isCatalogRead
        ? apiError(500, 'INTERNAL_ERROR', 'Erro interno ao consultar o catálogo.')
        : undefined
    case 'falha-temporaria':
      await delay(DEFAULT_LATENCY_MS)
      return count === 1
        ? apiError(503, 'SERVICE_UNAVAILABLE', 'Serviço temporariamente indisponível.')
        : undefined
    case 'timeout':
      if (isCatalogRead) await delay('infinite')
      await delay(DEFAULT_LATENCY_MS)
      return undefined
    case 'favorito-falha':
      await delay(DEFAULT_LATENCY_MS)
      return group === 'favorites' && !isRead
        ? apiError(500, 'INTERNAL_ERROR', 'Não foi possível atualizar seus favoritos.')
        : undefined
    default:
      await delay(DEFAULT_LATENCY_MS)
      return undefined
  }
}

/** Envolve um resolver com as condições de rede do cenário ativo. */
export function withNetwork<Params extends Record<string, string | readonly string[]>>(
  group: EndpointGroup,
  resolver: HttpResponseResolver<Params>,
): HttpResponseResolver<Params> {
  return async (info) => {
    const failure = await applyNetwork(group, info.request)
    if (failure) return failure
    return resolver(info)
  }
}
