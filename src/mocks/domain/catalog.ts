import type { EditionOption, NftSummary } from '@/api/contracts/nfts'
import type { NftRecord } from '@/mocks/db/schema'
import { isSoldOut } from '@/mocks/fixtures/nfts'

export function toSummary(nft: NftRecord): NftSummary {
  return {
    id: nft.id,
    name: nft.name,
    image: nft.image,
    collection: nft.collection,
    network: nft.network,
    priceEth: nft.priceEth,
    previousPriceEth: nft.previousPriceEth,
    soldOut: isSoldOut(nft.editions),
    rare: nft.rare,
    version: nft.version,
  }
}

export function findEdition(nft: NftRecord, editionId: string): EditionOption | undefined {
  return nft.editions.find((edition) => edition.id === editionId)
}

/** Quanto pode ser pedido agora: unidades da edição (aberta = sem limite) e limite por pedido. */
export function maxOrderable(nft: NftRecord, edition: EditionOption): number {
  const available = edition.available ?? Number.POSITIVE_INFINITY
  return Math.max(0, Math.min(available, nft.maxPerOrder))
}

/** Marca o NFT como alterado (preço ou disponibilidade): os eventos usam a versão. */
export function touchNft(nft: NftRecord) {
  nft.soldOut = isSoldOut(nft.editions)
  nft.version += 1
}

export function lineIdOf(nftId: string, editionId: string): string {
  return `${nftId}__${editionId}`
}
