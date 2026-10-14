import type { ImageAsset, Network } from '@/api/contracts/common'
import type { Collection, EditionOption, NftDetail, Review } from '@/api/contracts/nfts'
import { COLLECTION_LABELS, COLLECTIONS } from '@/api/contracts/nfts'
import { createRandom } from '@/mocks/lib/random'

/** As 4 artes do Figma, em variantes WebP geradas por scripts/optimize-images.mjs. */
function art(name: string, alt: string): ImageAsset {
  return {
    src: `/nfts/${name}-512.webp`,
    alt,
    width: 1254,
    height: 1254,
    variants: [256, 512, 900].map((width) => ({ width, src: `/nfts/${name}-${width}.webp` })),
  }
}

const ARTS = {
  apeGreen: art('ape-green-jacket', 'Macaco de óculos redondos e jaqueta verde'),
  gorillaPurple: art('gorilla-purple-hoodie', 'Gorila de chapéu bucket e moletom roxo'),
  gorillaCream: art('gorilla-cream-jacket', 'Gorila escuro de jaqueta creme'),
  apeHeadphones: art('ape-headphones', 'Macaco dourado com fones de ouvido'),
}

const ART_LIST = Object.values(ARTS)

const CREATORS = [
  { name: 'Nova Sato', handle: '@novasato' },
  { name: 'Lia Monteiro', handle: '@liamonteiro' },
  { name: 'Coletivo Brasa', handle: '@coletivobrasa' },
  { name: 'Rafa Kenji', handle: '@rafakenji' },
  { name: 'Studio Cobre', handle: '@studiocobre' },
] as const

const SERIES = ['Kurio Apes', 'Kurio Editions', 'Copper Club', 'Gênesis Kurio'] as const

/** Lançamentos a partir desta data aparecem na aba "Novos lançamentos". */
export const NEW_RELEASE_CUTOFF = '2026-09-28T00:00:00.000Z'
/** NFTs com pelo menos este número de favoritos aparecem em "Em alta". */
export const TRENDING_MIN_FAVORITES = 60

/** Data de referência das fixtures (listagens mais recentes primeiro). */
const LISTING_BASE = Date.parse('2026-10-10T12:00:00.000Z')

/** Tiragens do Figma: 1/1, 1/10, 1/50 e aberta. `[id, disponíveis]`; aberta não tem limite. */
type EditionSeed = ['1-1' | '1-10' | '1-50', number] | ['aberta']

const EDITION_SUPPLY = { '1-1': 1, '1-10': 10, '1-50': 50 } as const
const EDITION_LABEL = { '1-1': '1/1', '1-10': '1/10', '1-50': '1/50', aberta: 'Aberta' } as const

function toEditions(seeds: EditionSeed[]): EditionOption[] {
  return seeds.map((seed) =>
    seed[0] === 'aberta'
      ? { id: 'aberta', label: EDITION_LABEL.aberta, supply: null, available: null }
      : { id: seed[0], label: EDITION_LABEL[seed[0]], supply: EDITION_SUPPLY[seed[0]], available: seed[1] },
  )
}

interface NftSeed {
  name: string
  art: ImageAsset
  priceEth: string
  previousPriceEth?: string
  collection: Collection
  network: Network
  editions: EditionSeed[]
  maxPerOrder?: number
  favoritesCount?: number
  attributes?: string[]
}

/** Os 9 cards da página 1 do Figma, na mesma ordem. */
const FIGMA_GRID: NftSeed[] = [
  {
    name: 'Emerald Ape #042',
    art: ARTS.apeGreen,
    priceEth: '1.19',
    collection: 'arte-digital',
    network: 'ethereum',
    // Como no Figma: 1/1 (aqui indisponível), 1/10, 1/50 e aberta.
    editions: [['1-1', 0], ['1-10', 4], ['1-50', 21], ['aberta']],
    maxPerOrder: 5,
    favoritesCount: 88,
    attributes: ['Óculos', 'Esmeralda', 'Raro'],
  },
  { name: 'Sage Nomad #089', art: ARTS.gorillaPurple, priceEth: '1.69', collection: 'arte-digital', network: 'ethereum', editions: [['1-1', 1]], favoritesCount: 41 },
  { name: 'Noir Vessel #552', art: ARTS.gorillaCream, priceEth: '1.99', previousPriceEth: '2.29', collection: 'colecionaveis', network: 'polygon', editions: [['1-10', 2], ['1-50', 30]], maxPerOrder: 3, favoritesCount: 63 },
  { name: 'Cosmic Bloom #118', art: ARTS.gorillaPurple, priceEth: '1.29', collection: 'generativa', network: 'ethereum', editions: [['1-1', 1]], favoritesCount: 22 },
  { name: 'Violet Nomad #374', art: ARTS.gorillaPurple, priceEth: '1.39', collection: 'arte-3d', network: 'solana', editions: [['1-50', 12], ['aberta']], maxPerOrder: 4, favoritesCount: 35 },
  { name: 'Ivory Baron #808', art: ARTS.gorillaCream, priceEth: '1.59', collection: 'fotografia', network: 'ethereum', editions: [['1-1', 1]], favoritesCount: 74 },
  { name: 'Golden Beat #207', art: ARTS.apeHeadphones, priceEth: '0.99', collection: 'musica', network: 'polygon', editions: [['1-10', 6], ['1-50', 25]], maxPerOrder: 5, favoritesCount: 97 },
  { name: 'Golden Groove #031', art: ARTS.apeHeadphones, priceEth: '0.99', collection: 'musica', network: 'ethereum', editions: [['1-10', 3]], maxPerOrder: 3, favoritesCount: 18 },
  { name: 'Golden Signal #160', art: ARTS.apeHeadphones, priceEth: '0.35', collection: 'musica', network: 'solana', editions: [['aberta']], maxPerOrder: 10, favoritesCount: 52 },
]

/** NFTs com papel fixo nos cenários de teste. */
const SPECIAL: NftSeed[] = [
  // Todas as edições esgotadas.
  { name: 'Onyx Relic #001', art: ARTS.gorillaCream, priceEth: '4.20', collection: 'colecionaveis', network: 'ethereum', editions: [['1-1', 0], ['1-10', 0]], maxPerOrder: 2, favoritesCount: 70 },
  // Última unidade: limite de quantidade igual a 1.
  { name: 'Amber Pilot #777', art: ARTS.apeGreen, priceEth: '2.75', collection: 'jogos', network: 'polygon', editions: [['1-10', 1]], maxPerOrder: 5, favoritesCount: 12 },
  // Extremos da faixa de preço do Figma (0,02 a 12,30 ETH).
  { name: 'Copper Seed #003', art: ARTS.apeHeadphones, priceEth: '0.02', collection: 'assinaturas', network: 'polygon', editions: [['aberta']], maxPerOrder: 10, favoritesCount: 5 },
  { name: 'Crimson Monarch #900', art: ARTS.gorillaPurple, priceEth: '12.30', collection: 'arte-digital', network: 'ethereum', editions: [['1-1', 1]], favoritesCount: 130 },
]

const PREFIXES = ['Velvet', 'Lunar', 'Solar', 'Rust', 'Echo', 'Drift', 'Ember', 'Quartz', 'Saffron', 'Cobalt', 'Mossy', 'Static']
const SUFFIXES = ['Ape', 'Nomad', 'Vessel', 'Bloom', 'Baron', 'Rider', 'Oracle', 'Totem', 'Courier', 'Warden']
const ATTRIBUTE_POOL = ['Óculos', 'Bucket', 'Jaqueta', 'Fones', 'Dourado', 'Esmeralda', 'Neon', 'Raro', 'Lendário', 'Comum']
const GENERATED_COUNT = 34

function generateSeeds(): NftSeed[] {
  const random = createRandom(20261014)
  const usedNames = new Set<string>()
  const seeds: NftSeed[] = []

  for (let i = 0; seeds.length < GENERATED_COUNT; i++) {
    const name = `${random.pick(PREFIXES)} ${random.pick(SUFFIXES)} #${String(random.int(100, 999))}`
    if (usedNames.has(name)) continue
    usedNames.add(name)

    const cents = random.int(10, 1200)
    const editions: EditionSeed[] = []
    if (random.next() < 0.5) editions.push(['1-1', random.next() < 0.85 ? 1 : 0])
    if (random.next() < 0.5) editions.push(['1-10', random.int(0, 10)])
    if (random.next() < 0.4) editions.push(['1-50', random.int(0, 50)])
    if (editions.length === 0 || random.next() < 0.2) editions.push(['aberta'])

    seeds.push({
      name,
      art: random.pick(ART_LIST),
      priceEth: (cents / 100).toFixed(2),
      previousPriceEth: i % 7 === 3 ? ((cents + random.int(10, 80)) / 100).toFixed(2) : undefined,
      collection: COLLECTIONS[i % COLLECTIONS.length],
      network: random.pick(['ethereum', 'ethereum', 'polygon', 'solana'] as const),
      editions,
      maxPerOrder: random.int(1, 6),
      favoritesCount: random.int(0, 120),
      attributes: [random.pick(ATTRIBUTE_POOL), random.pick(ATTRIBUTE_POOL)].filter((value, index, list) => list.indexOf(value) === index),
    })
  }
  return seeds
}

const SUMMARIES: Record<Collection, string> = {
  'arte-digital': 'Um colecionável digital finalizado à mão, verificado na rede, com arte desbloqueável e acesso para colecionadores.',
  fotografia: 'Retrato digital tratado em camadas, com iluminação de estúdio e acabamento analógico.',
  musica: 'NFT musical com faixa exclusiva e acesso antecipado aos próximos lançamentos do artista.',
  'arte-3d': 'Escultura 3D renderizada em alta resolução, pensada para galerias virtuais.',
  colecionaveis: 'Colecionável de tiragem limitada, parte de uma série numerada.',
  generativa: 'Obra generativa criada por algoritmo autoral, com variações únicas a cada edição.',
  jogos: 'Item de jogo com utilidade dentro do universo da coleção.',
  assinaturas: 'Passe de assinatura que libera conteúdos e eventos da comunidade.',
  utilidade: 'Token de utilidade com benefícios para quem participa da coleção.',
}

const NETWORK_NAMES: Record<Network, string> = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' }

function story(name: string, series: string, creator: string, network: Network, royalty: number): string[] {
  return [
    `${name} é uma obra digital finalizada à mão da coleção ${series}. Cada atributo fica armazenado nos metadados do token e verificado na ${NETWORK_NAMES[network]}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
    `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência na rede. ${creator} recebe ${royalty}% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
  ]
}

const REVIEW_AUTHORS = ['Marina C.', 'Diego R.', 'Paula T.', 'Hugo M.', 'Bia L.']
const REVIEW_COMMENTS = [
  'Arte impecável, a versão em alta resolução é ainda melhor.',
  'Compra tranquila e a procedência está toda registrada.',
  'Os benefícios para colecionadores valem muito a pena.',
  'Detalhes incríveis, ficou ótima na minha galeria.',
  'Entrega instantânea e comunidade muito ativa.',
]

function reviews(index: number): { rating: NftDetail['rating']; reviews: Review[] } {
  const random = createRandom(5000 + index)
  const count = random.int(3, 40)
  const items = Array.from({ length: 3 }, (_, offset) => ({
    id: `rev-${index + 1}-${offset + 1}`,
    author: REVIEW_AUTHORS[(index + offset) % REVIEW_AUTHORS.length],
    rating: random.int(4, 5),
    comment: REVIEW_COMMENTS[(index + offset * 2) % REVIEW_COMMENTS.length],
    createdAt: new Date(LISTING_BASE - (offset + 1) * 86_400_000).toISOString(),
  }))
  // Média com uma casa, entre 4,0 e 5,0.
  const average = Math.round((4 + random.next()) * 10) / 10
  return { rating: { average, count }, reviews: items }
}

function tokenStandard(network: Network, editions: EditionOption[]): NftDetail['tokenStandard'] {
  if (network === 'solana') return 'SPL'
  return editions.some((edition) => edition.supply !== 1) ? 'ERC-1155' : 'ERC-721'
}

function contractAddress(network: Network, index: number): string {
  const random = createRandom(9000 + index)
  if (network === 'solana') {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    return Array.from({ length: 44 }, () => random.pick([...alphabet])).join('')
  }
  return `0x${random.hex(40)}`
}

export function isSoldOut(editions: EditionOption[]): boolean {
  return editions.every((edition) => edition.available === 0)
}

export function createNftFixtures(): NftDetail[] {
  const seeds = [...FIGMA_GRID, ...generateSeeds(), ...SPECIAL]

  return seeds.map((seed, index) => {
    const id = `nft-${String(index + 1).padStart(3, '0')}`
    const editions = toEditions(seed.editions)
    const creator = CREATORS[index % CREATORS.length]
    const series = SERIES[index % SERIES.length]
    const royaltyPercent = 5
    const tokenNumber = seed.name.match(/#(\d+)/)?.[1] ?? String(index + 1)

    return {
      id,
      name: seed.name,
      image: seed.art,
      // Só existem 4 artes no Figma; a galeria repete a arte principal como no layout.
      gallery: Array.from({ length: 4 }, (_, view) => ({ ...seed.art, alt: `${seed.art.alt} (vista ${view + 1} de 4)` })),
      collection: seed.collection,
      network: seed.network,
      priceEth: seed.priceEth,
      previousPriceEth: seed.previousPriceEth ?? null,
      soldOut: isSoldOut(editions),
      editions,
      maxPerOrder: seed.maxPerOrder ?? 1,
      description: SUMMARIES[seed.collection],
      story: story(seed.name, series, creator.name, seed.network, royaltyPercent),
      creator,
      series,
      tokenId: `#${tokenNumber.padStart(4, '0')}`,
      attributes: seed.attributes ?? [COLLECTION_LABELS[seed.collection], 'Edição limitada'],
      royaltyPercent,
      contractAddress: contractAddress(seed.network, index),
      tokenStandard: tokenStandard(seed.network, editions),
      // Mais recente primeiro: os 9 do Figma abrem a ordenação "Listados recentemente".
      listedAt: new Date(LISTING_BASE - index * 9 * 3600_000).toISOString(),
      favoritesCount: seed.favoritesCount ?? 0,
      ...reviews(index),
      version: 1,
    }
  })
}

/** Ids com papel fixo, usados em testes e na documentação dos cenários. */
export const SPECIAL_NFT_IDS = {
  soldOut: `nft-${String(FIGMA_GRID.length + GENERATED_COUNT + 1).padStart(3, '0')}`,
  lastEdition: `nft-${String(FIGMA_GRID.length + GENERATED_COUNT + 2).padStart(3, '0')}`,
} as const
