import type {
  EthAmount,
  ImageAsset,
  IsoDateTime,
  Network,
  Paginated,
} from '@/api/contracts/common'

export const COLLECTIONS = [
  'arte-digital',
  'fotografia',
  'musica',
  'arte-3d',
  'colecionaveis',
  'generativa',
  'jogos',
  'assinaturas',
  'utilidade',
] as const
export type Collection = (typeof COLLECTIONS)[number]

export const COLLECTION_LABELS: Record<Collection, string> = {
  'arte-digital': 'Arte digital',
  fotografia: 'Fotografia',
  musica: 'Música',
  'arte-3d': 'Arte 3D',
  colecionaveis: 'Colecionáveis',
  generativa: 'Generativa',
  jogos: 'Jogos',
  assinaturas: 'Assinaturas',
  utilidade: 'Utilidade',
}

/** Abas do catálogo no Figma: Todos os NFTs | Novos lançamentos | Em alta. */
export const CATALOG_TABS = ['todos', 'novos', 'em-alta'] as const
export type CatalogTab = (typeof CATALOG_TABS)[number]

export const CATALOG_SORTS = ['recentes', 'preco-asc', 'preco-desc', 'populares'] as const
export type CatalogSort = (typeof CATALOG_SORTS)[number]

export interface Creator {
  name: string
  handle: string
}

export interface Editions {
  total: number
  available: number
}

/** Item da listagem do catálogo. */
export interface NftSummary {
  id: string
  name: string
  image: ImageAsset
  collection: Collection
  network: Network
  priceEth: EthAmount
  /** Preço anterior (card com desconto). */
  previousPriceEth: EthAmount | null
  editions: Editions
  /** Versão do recurso; aumenta a cada mudança de preço ou disponibilidade. */
  version: number
}

/** Detalhe do NFT. */
export interface NftDetail extends NftSummary {
  description: string
  creator: Creator
  gallery: ImageAsset[]
  /** Máximo por pedido, além do limite de edições disponíveis. */
  maxPerOrder: number
  contractAddress: string
  tokenStandard: 'ERC-721' | 'ERC-1155' | 'SPL'
  listedAt: IsoDateTime
  favoritesCount: number
}

/** GET /nfts: parâmetros de busca. Listas repetem a chave (`collection=a&collection=b`). */
export interface NftListParams {
  q?: string
  collection?: Collection[]
  network?: Network[]
  priceMin?: EthAmount
  priceMax?: EthAmount
  tab?: CatalogTab
  sort?: CatalogSort
  page?: number
}

export interface FacetCount<T extends string> {
  value: T
  count: number
}

export interface NftListFacets {
  /** Contagem por coleção considerando os demais filtros. */
  collections: FacetCount<Collection>[]
  networks: FacetCount<Network>[]
  /** Faixa de preço do catálogo inteiro (limites do slider). */
  priceRange: { min: EthAmount; max: EthAmount }
}

export interface NftListResponse extends Paginated<NftSummary> {
  facets: NftListFacets
}

/** GET /nfts/:id → 200 `NftDetail` (404 NFT_NOT_FOUND). */
export type NftDetailResponse = NftDetail
