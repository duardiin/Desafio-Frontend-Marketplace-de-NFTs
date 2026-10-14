import { env } from '@/config/env'

/**
 * Cenários globais da API simulada: condições de rede e falhas reproduzíveis.
 * Casos de negócio (cupons, NFT esgotado, e-mail já cadastrado) vêm dos dados
 * das fixtures e funcionam em qualquer cenário.
 */
export const SCENARIOS = {
  default: 'Sucesso, latência curta e fixa (150 ms)',
  vazio: 'Catálogo sem resultados',
  lento: 'Todas as respostas com 2,5 s de latência',
  'latencia-variavel': 'Latência entre 200 ms e 2 s (sequência determinística)',
  'fora-de-ordem': 'Buscas do catálogo alternam 1,8 s e 0,2 s: respostas chegam fora de ordem',
  offline: 'Falha de conexão em todas as chamadas',
  'erro-500': 'Catálogo e detalhe respondem 500',
  'falha-temporaria': 'Primeira chamada de cada recurso responde 503; as seguintes funcionam',
  timeout: 'Catálogo e detalhe nunca respondem (estoura o timeout do cliente)',
  'sessao-expirada': 'Sessões novas expiram em 30 s',
  'favorito-falha': 'Incluir e remover favoritos respondem 500',
  'pagamento-recusado': 'Pagamentos são recusados pela simulação',
  'pedido-timeout': 'A criação do pedido grava, mas a 1ª resposta estoura o timeout',
  'preco-alterado': 'O preço de um item muda ao enviar o pedido (cotação desatualizada)',
  'edicao-esgotada': 'Um item esgota ao enviar o pedido',
} as const

export type ScenarioName = keyof typeof SCENARIOS

const STORAGE_KEY = 'kurio:mock-scenario'

export function isScenarioName(value: string): value is ScenarioName {
  return Object.hasOwn(SCENARIOS, value)
}

/** Ordem: escolhido na sessão do navegador (?cenario=) > VITE_MOCK_SCENARIO > default. */
export function getActiveScenario(): ScenarioName {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored && isScenarioName(stored)) return stored
  } catch {
    // sessionStorage indisponível: segue para o valor de ambiente.
  }
  return isScenarioName(env.mockScenario) ? env.mockScenario : 'default'
}

export function setActiveScenario(name: ScenarioName) {
  try {
    sessionStorage.setItem(STORAGE_KEY, name)
  } catch {
    // Sem sessionStorage o cenário vale só pelo env.
  }
}
