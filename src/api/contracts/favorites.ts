import type { NftSummary } from '@/api/contracts/nfts'

/** GET /me/favorites → 200. Exige sessão. */
export interface FavoritesResponse {
  items: NftSummary[]
}

/** PUT /me/favorites/:nftId e DELETE /me/favorites/:nftId → 200. Idempotentes. */
export interface FavoriteMutationResponse {
  nftId: string
  favorited: boolean
}
