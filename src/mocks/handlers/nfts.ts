import Decimal from 'decimal.js'
import { http, HttpResponse } from 'msw'
import type { Network } from '@/api/contracts/common'
import { NETWORKS } from '@/api/contracts/common'
import type {
  CatalogSort,
  CatalogTab,
  Collection,
  FacetCount,
  NftListResponse,
} from '@/api/contracts/nfts'
import { CATALOG_SORTS, CATALOG_TABS, COLLECTIONS } from '@/api/contracts/nfts'
import { getDb } from '@/mocks/db/store'
import type { NftRecord } from '@/mocks/db/schema'
import { toSummary } from '@/mocks/domain/catalog'
import { NEW_RELEASE_CUTOFF, TRENDING_MIN_FAVORITES } from '@/mocks/fixtures/nfts'
import { api } from '@/mocks/handlers/paths'
import { compareEth } from '@/mocks/lib/eth'
import { apiError } from '@/mocks/lib/http'
import { withNetwork } from '@/mocks/network'
import { getActiveScenario } from '@/mocks/scenarios'

export const CATALOG_PAGE_SIZE = 9

interface Filters {
  q: string
  collections: Collection[]
  networks: Network[]
  priceMin: Decimal | null
  priceMax: Decimal | null
  tab: CatalogTab
  sort: CatalogSort
  page: number
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function parseDecimal(value: string | null): Decimal | null {
  if (!value) return null
  try {
    const parsed = new Decimal(value)
    return parsed.isFinite() && parsed.gte(0) ? parsed : null
  } catch {
    return null
  }
}

function oneOf<T extends string>(allowed: readonly T[], value: string | null, fallback: T): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

function parseFilters(url: URL): Filters {
  const params = url.searchParams
  const page = Number.parseInt(params.get('page') ?? '1', 10)
  return {
    q: normalize(params.get('q')?.trim() ?? ''),
    collections: params.getAll('collection').filter((value): value is Collection =>
      (COLLECTIONS as readonly string[]).includes(value),
    ),
    networks: params.getAll('network').filter((value): value is Network =>
      (NETWORKS as readonly string[]).includes(value),
    ),
    priceMin: parseDecimal(params.get('priceMin')),
    priceMax: parseDecimal(params.get('priceMax')),
    tab: oneOf(CATALOG_TABS, params.get('tab'), 'todos'),
    sort: oneOf(CATALOG_SORTS, params.get('sort'), 'recentes'),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

type Dimension = 'collection' | 'network'

/** Aplica todos os filtros, exceto a dimensão ignorada (para calcular as contagens). */
function matches(nft: NftRecord, filters: Filters, ignore?: Dimension): boolean {
  if (filters.q) {
    const haystack = normalize(`${nft.name} ${nft.creator.name} ${nft.collection}`)
    if (!haystack.includes(filters.q)) return false
  }
  if (ignore !== 'collection' && filters.collections.length > 0 && !filters.collections.includes(nft.collection)) {
    return false
  }
  if (ignore !== 'network' && filters.networks.length > 0 && !filters.networks.includes(nft.network)) {
    return false
  }
  if (filters.priceMin && compareEth(nft.priceEth, filters.priceMin) < 0) return false
  if (filters.priceMax && compareEth(nft.priceEth, filters.priceMax) > 0) return false
  if (filters.tab === 'novos' && nft.listedAt < NEW_RELEASE_CUTOFF) return false
  if (filters.tab === 'em-alta' && nft.favoritesCount < TRENDING_MIN_FAVORITES) return false
  return true
}

function sortNfts(items: NftRecord[], sort: CatalogSort): NftRecord[] {
  const byId = (a: NftRecord, b: NftRecord) => a.id.localeCompare(b.id)
  return [...items].sort((a, b) => {
    switch (sort) {
      case 'preco-asc':
        return compareEth(a.priceEth, b.priceEth) || byId(a, b)
      case 'preco-desc':
        return compareEth(b.priceEth, a.priceEth) || byId(a, b)
      case 'populares':
        return b.favoritesCount - a.favoritesCount || byId(a, b)
      default:
        return b.listedAt.localeCompare(a.listedAt) || byId(a, b)
    }
  })
}

function countBy<T extends string>(
  values: readonly T[],
  items: NftRecord[],
  pick: (nft: NftRecord) => T,
): FacetCount<T>[] {
  return values.map((value) => ({ value, count: items.filter((nft) => pick(nft) === value).length }))
}

export const nftHandlers = [
  http.get(
    api('/nfts'),
    withNetwork('catalog', ({ request }) => {
      const filters = parseFilters(new URL(request.url))
      const all = getActiveScenario() === 'vazio' ? [] : getDb().nfts

      const result = sortNfts(
        all.filter((nft) => matches(nft, filters)),
        filters.sort,
      )
      const totalPages = Math.max(1, Math.ceil(result.length / CATALOG_PAGE_SIZE))
      const start = (filters.page - 1) * CATALOG_PAGE_SIZE
      const prices = getDb().nfts.map((nft) => new Decimal(nft.priceEth))

      return HttpResponse.json<NftListResponse>({
        items: result.slice(start, start + CATALOG_PAGE_SIZE).map(toSummary),
        page: filters.page,
        pageSize: CATALOG_PAGE_SIZE,
        totalItems: result.length,
        totalPages,
        facets: {
          collections: countBy(
            COLLECTIONS,
            all.filter((nft) => matches(nft, filters, 'collection')),
            (nft) => nft.collection,
          ),
          networks: countBy(
            NETWORKS,
            all.filter((nft) => matches(nft, filters, 'network')),
            (nft) => nft.network,
          ),
          priceRange: {
            min: Decimal.min(...prices).toFixed(),
            max: Decimal.max(...prices).toFixed(),
          },
        },
      })
    }),
  ),

  http.get(
    api('/nfts/:id'),
    withNetwork('detail', ({ params }) => {
      const nft = getDb().nfts.find((item) => item.id === params.id)
      if (!nft) return apiError(404, 'NFT_NOT_FOUND', 'Este NFT não existe ou foi removido.')
      return HttpResponse.json(nft)
    }),
  ),
]
