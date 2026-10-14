import type { NftSummary } from '@/api/contracts/nfts'
import type { NftRecord } from '@/mocks/db/schema'

export function toSummary(nft: NftRecord): NftSummary {
  return {
    id: nft.id,
    name: nft.name,
    image: nft.image,
    collection: nft.collection,
    network: nft.network,
    priceEth: nft.priceEth,
    previousPriceEth: nft.previousPriceEth,
    editions: { ...nft.editions },
    version: nft.version,
  }
}

/** Quanto pode ser pedido agora: edições disponíveis e limite por pedido. */
export function maxOrderable(nft: NftRecord): number {
  return Math.max(0, Math.min(nft.editions.available, nft.maxPerOrder))
}
