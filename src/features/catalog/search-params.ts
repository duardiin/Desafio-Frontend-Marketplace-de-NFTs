import Decimal from 'decimal.js'
import type { Network } from '@/api/contracts/common'
import { NETWORKS } from '@/api/contracts/common'
import type { CatalogSort, CatalogTab, Collection, NftListParams } from '@/api/contracts/nfts'
import { CATALOG_SORTS, CATALOG_TABS, COLLECTIONS } from '@/api/contracts/nfts'

/**
 * Estado do catálogo na URL da Início. Chaves em português e listas separadas
 * por vírgula: `/?q=ape&colecao=musica,arte-3d&rede=polygon&precoMin=0.5&aba=em-alta&ordem=preco-asc&pagina=2`.
 * Valores inválidos são descartados; padrões não aparecem na URL.
 */
export interface CatalogSearch {
  q?: string
  colecao?: string
  rede?: string
  precoMin?: string
  precoMax?: string
  aba?: CatalogTab
  ordem?: CatalogSort
  pagina?: number
}

function oneOf<T extends string>(allowed: readonly T[], value: unknown): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : undefined
}

/** Lista válida, sem repetição, na ordem canônica (URLs equivalentes ficam iguais). */
function listOf<T extends string>(allowed: readonly T[], value: unknown): T[] {
  if (typeof value !== 'string') return []
  const requested = new Set(value.split(','))
  return allowed.filter((item) => requested.has(item))
}

function decimalParam(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\d+(\.\d+)?$/.test(value)) return undefined
  return new Decimal(value).toFixed()
}

export function validateCatalogSearch(raw: Record<string, unknown>): CatalogSearch {
  const page = typeof raw.pagina === 'string' || typeof raw.pagina === 'number' ? Number(raw.pagina) : NaN
  const collections = listOf(COLLECTIONS, raw.colecao)
  const networks = listOf(NETWORKS, raw.rede)
  const q = typeof raw.q === 'string' ? raw.q.trim().slice(0, 80) : ''
  const aba = oneOf(CATALOG_TABS, raw.aba)
  const ordem = oneOf(CATALOG_SORTS, raw.ordem)

  return {
    q: q || undefined,
    colecao: collections.length > 0 ? collections.join(',') : undefined,
    rede: networks.length > 0 ? networks.join(',') : undefined,
    precoMin: decimalParam(raw.precoMin),
    precoMax: decimalParam(raw.precoMax),
    aba: aba === 'todos' ? undefined : aba,
    ordem: ordem === 'recentes' ? undefined : ordem,
    pagina: Number.isInteger(page) && page > 1 ? page : undefined,
  }
}

export function selectedCollections(search: CatalogSearch): Collection[] {
  return listOf(COLLECTIONS, search.colecao)
}

export function selectedNetworks(search: CatalogSearch): Network[] {
  return listOf(NETWORKS, search.rede)
}

/** Parâmetros enviados à API (os nomes da API são os do contrato). */
export function toApiParams(search: CatalogSearch): NftListParams {
  return {
    q: search.q,
    collection: selectedCollections(search),
    network: selectedNetworks(search),
    priceMin: search.precoMin,
    priceMax: search.precoMax,
    tab: search.aba ?? 'todos',
    sort: search.ordem ?? 'recentes',
    page: search.pagina ?? 1,
  }
}

/**
 * Aplica uma mudança de filtro. Qualquer filtro novo volta para a página 1
 * (exigência do enunciado); só a paginação muda `pagina`.
 */
export function withFilter(search: CatalogSearch, patch: Partial<CatalogSearch>): CatalogSearch {
  return validateCatalogSearch({ ...search, ...patch, pagina: undefined })
}

export function toggleInList(current: string | undefined, value: string): string | undefined {
  const values = new Set(current ? current.split(',') : [])
  if (values.has(value)) values.delete(value)
  else values.add(value)
  return values.size > 0 ? [...values].join(',') : undefined
}

export function hasActiveFilters(search: CatalogSearch): boolean {
  return Boolean(search.q || search.colecao || search.rede || search.precoMin || search.precoMax || search.aba)
}

/** Filtros ativos (coleções, redes e faixa de preço), para o contador dos botões "Filtros". */
export function activeFilterCount(search: CatalogSearch): number {
  return selectedCollections(search).length + selectedNetworks(search).length + (search.precoMin || search.precoMax ? 1 : 0)
}
