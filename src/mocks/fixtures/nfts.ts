import type { ImageAsset, Network } from '@/api/contracts/common'
import type { Collection, NftDetail } from '@/api/contracts/nfts'
import { COLLECTIONS } from '@/api/contracts/nfts'
import { createRandom } from '@/mocks/lib/random'

/** As 4 artes do Figma (public/nfts). O catálogo as reutiliza. */
const ARTS = {
  apeGreen: {
    src: '/nfts/ape-green-jacket.png',
    alt: 'Macaco de óculos redondos e jaqueta verde',
  },
  gorillaPurple: {
    src: '/nfts/gorilla-purple-hoodie.png',
    alt: 'Gorila de chapéu bucket e moletom roxo',
  },
  gorillaCream: {
    src: '/nfts/gorilla-cream-jacket.png',
    alt: 'Gorila escuro de jaqueta creme',
  },
  apeHeadphones: {
    src: '/nfts/ape-headphones.png',
    alt: 'Macaco dourado com fones de ouvido',
  },
} satisfies Record<string, ImageAsset>

const ART_LIST = Object.values(ARTS)

const CREATORS = [
  { name: 'Studio Cobre', handle: '@studiocobre' },
  { name: 'Lia Monteiro', handle: '@liamonteiro' },
  { name: 'Coletivo Brasa', handle: '@coletivobrasa' },
  { name: 'Rafa Kenji', handle: '@rafakenji' },
  { name: 'Nina Vale', handle: '@ninavale' },
] as const

/** Lançamentos a partir desta data aparecem na aba "Novos lançamentos". */
export const NEW_RELEASE_CUTOFF = '2026-09-28T00:00:00.000Z'
/** NFTs com pelo menos este número de favoritos aparecem em "Em alta". */
export const TRENDING_MIN_FAVORITES = 60

/** Data de referência das fixtures (listagens mais recentes primeiro). */
const LISTING_BASE = Date.parse('2026-10-10T12:00:00.000Z')

interface NftSeed {
  name: string
  art: ImageAsset
  priceEth: string
  previousPriceEth?: string
  collection: Collection
  network: Network
  editions?: { total: number; available: number }
  maxPerOrder?: number
  favoritesCount?: number
}

/** Os 9 cards da página 1 do Figma, na mesma ordem. */
const FIGMA_GRID: NftSeed[] = [
  { name: 'Emerald Ape #042', art: ARTS.apeGreen, priceEth: '1.19', collection: 'arte-digital', network: 'ethereum', favoritesCount: 88 },
  { name: 'Sage Nomad #089', art: ARTS.gorillaPurple, priceEth: '1.69', collection: 'arte-digital', network: 'ethereum', favoritesCount: 41 },
  { name: 'Noir Vessel #552', art: ARTS.gorillaCream, priceEth: '1.99', previousPriceEth: '2.29', collection: 'colecionaveis', network: 'polygon', favoritesCount: 63 },
  { name: 'Cosmic Bloom #118', art: ARTS.gorillaPurple, priceEth: '1.29', collection: 'generativa', network: 'ethereum', favoritesCount: 22 },
  { name: 'Violet Nomad #374', art: ARTS.gorillaPurple, priceEth: '1.39', collection: 'arte-3d', network: 'solana', favoritesCount: 35 },
  { name: 'Ivory Baron #808', art: ARTS.gorillaCream, priceEth: '1.59', collection: 'fotografia', network: 'ethereum', favoritesCount: 74 },
  { name: 'Golden Beat #207', art: ARTS.apeHeadphones, priceEth: '0.99', collection: 'musica', network: 'polygon', editions: { total: 25, available: 12 }, maxPerOrder: 5, favoritesCount: 97 },
  { name: 'Golden Groove #031', art: ARTS.apeHeadphones, priceEth: '0.99', collection: 'musica', network: 'ethereum', editions: { total: 10, available: 3 }, maxPerOrder: 3, favoritesCount: 18 },
  { name: 'Golden Signal #160', art: ARTS.apeHeadphones, priceEth: '0.35', collection: 'musica', network: 'solana', editions: { total: 50, available: 50 }, maxPerOrder: 10, favoritesCount: 52 },
]

/** NFTs com papel fixo nos cenários de teste. */
const SPECIAL: NftSeed[] = [
  // Edição esgotada: detalhe mostra indisponível; adicionar ao carrinho gera 409.
  { name: 'Onyx Relic #001', art: ARTS.gorillaCream, priceEth: '4.20', collection: 'colecionaveis', network: 'ethereum', editions: { total: 5, available: 0 }, maxPerOrder: 2, favoritesCount: 70 },
  // Última edição: limite de quantidade igual a 1.
  { name: 'Amber Pilot #777', art: ARTS.apeGreen, priceEth: '2.75', collection: 'jogos', network: 'polygon', editions: { total: 20, available: 1 }, maxPerOrder: 5, favoritesCount: 12 },
  // Extremos da faixa de preço do Figma (0,02 a 12,30 ETH).
  { name: 'Copper Seed #003', art: ARTS.apeHeadphones, priceEth: '0.02', collection: 'assinaturas', network: 'polygon', editions: { total: 500, available: 420 }, maxPerOrder: 10, favoritesCount: 5 },
  { name: 'Crimson Monarch #900', art: ARTS.gorillaPurple, priceEth: '12.30', collection: 'arte-digital', network: 'ethereum', favoritesCount: 130 },
]

const PREFIXES = ['Velvet', 'Lunar', 'Solar', 'Rust', 'Echo', 'Drift', 'Ember', 'Quartz', 'Saffron', 'Cobalt', 'Mossy', 'Static']
const SUFFIXES = ['Ape', 'Nomad', 'Vessel', 'Bloom', 'Baron', 'Rider', 'Oracle', 'Totem', 'Courier', 'Warden']
const GENERATED_COUNT = 34

function generateSeeds(): NftSeed[] {
  const random = createRandom(20261014)
  const usedNames = new Set<string>()
  const seeds: NftSeed[] = []

  for (let i = 0; seeds.length < GENERATED_COUNT; i++) {
    const name = `${random.pick(PREFIXES)} ${random.pick(SUFFIXES)} #${String(random.int(100, 999))}`
    if (usedNames.has(name)) continue
    usedNames.add(name)

    const network = random.pick(['ethereum', 'ethereum', 'polygon', 'solana'] as const)
    const cents = random.int(10, 1200)
    const priceEth = (cents / 100).toFixed(2)
    const hasDiscount = i % 7 === 3
    const isMultiEdition = random.next() < 0.4
    const total = isMultiEdition ? random.int(5, 100) : 1

    seeds.push({
      name,
      art: random.pick(ART_LIST),
      priceEth,
      previousPriceEth: hasDiscount ? ((cents + random.int(10, 80)) / 100).toFixed(2) : undefined,
      collection: COLLECTIONS[i % COLLECTIONS.length],
      network,
      editions: { total, available: isMultiEdition ? random.int(1, total) : 1 },
      maxPerOrder: isMultiEdition ? random.int(2, 10) : 1,
      favoritesCount: random.int(0, 120),
    })
  }
  return seeds
}

const DESCRIPTIONS: Record<Collection, string> = {
  'arte-digital': 'Peça de arte digital da curadoria Kurio, com traço autoral e paleta inspirada no cobre.',
  fotografia: 'Retrato digital tratado em camadas, com iluminação de estúdio e acabamento analógico.',
  musica: 'NFT musical com faixa exclusiva e acesso antecipado aos próximos lançamentos do artista.',
  'arte-3d': 'Escultura 3D renderizada em alta resolução, pensada para galerias virtuais.',
  colecionaveis: 'Colecionável de tiragem limitada, parte de uma série numerada.',
  generativa: 'Obra generativa criada por algoritmo autoral, com variações únicas a cada edição.',
  jogos: 'Item de jogo com utilidade dentro do universo da coleção.',
  assinaturas: 'Passe de assinatura que libera conteúdos e eventos da comunidade.',
  utilidade: 'Token de utilidade com benefícios para quem participa da coleção.',
}

function tokenStandard(network: Network, editions: { total: number }): NftDetail['tokenStandard'] {
  if (network === 'solana') return 'SPL'
  return editions.total > 1 ? 'ERC-1155' : 'ERC-721'
}

function contractAddress(network: Network, index: number): string {
  const random = createRandom(9000 + index)
  if (network === 'solana') {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    return Array.from({ length: 44 }, () => random.pick([...alphabet])).join('')
  }
  return `0x${random.hex(40)}`
}

export function createNftFixtures(): NftDetail[] {
  const seeds = [...FIGMA_GRID, ...generateSeeds(), ...SPECIAL]

  return seeds.map((seed, index) => {
    const id = `nft-${String(index + 1).padStart(3, '0')}`
    const editions = seed.editions ?? { total: 1, available: 1 }
    const otherArts = ART_LIST.filter((art) => art.src !== seed.art.src)

    return {
      id,
      name: seed.name,
      image: seed.art,
      gallery: [seed.art, otherArts[index % otherArts.length], otherArts[(index + 1) % otherArts.length]],
      collection: seed.collection,
      network: seed.network,
      priceEth: seed.priceEth,
      previousPriceEth: seed.previousPriceEth ?? null,
      editions,
      maxPerOrder: seed.maxPerOrder ?? 1,
      description: DESCRIPTIONS[seed.collection],
      creator: CREATORS[index % CREATORS.length],
      contractAddress: contractAddress(seed.network, index),
      tokenStandard: tokenStandard(seed.network, editions),
      // Mais recente primeiro: os 9 do Figma abrem a ordenação "Listados recentemente".
      listedAt: new Date(LISTING_BASE - index * 9 * 3600_000).toISOString(),
      favoritesCount: seed.favoritesCount ?? 0,
      version: 1,
    }
  })
}

/** Ids com papel fixo, usados em testes e na documentação dos cenários. */
export const SPECIAL_NFT_IDS = {
  soldOut: `nft-${String(FIGMA_GRID.length + GENERATED_COUNT + 1).padStart(3, '0')}`,
  lastEdition: `nft-${String(FIGMA_GRID.length + GENERATED_COUNT + 2).padStart(3, '0')}`,
} as const
