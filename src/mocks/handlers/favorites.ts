import { http, HttpResponse } from 'msw'
import type { FavoriteMutationResponse, FavoritesResponse } from '@/api/contracts/favorites'
import { commit, getDb } from '@/mocks/db/store'
import { toSummary } from '@/mocks/domain/catalog'
import { api } from '@/mocks/handlers/paths'
import { apiError, requireUser } from '@/mocks/lib/http'
import { withNetwork } from '@/mocks/network'

function setFavorite(userId: string, nftId: string, favorited: boolean) {
  const db = getDb()
  const nft = db.nfts.find((item) => item.id === nftId)
  if (!nft) return apiError(404, 'NFT_NOT_FOUND', 'Este NFT não existe ou foi removido.')

  const current = db.favorites[userId] ?? []
  const isFavorite = current.includes(nftId)
  if (favorited !== isFavorite) {
    db.favorites[userId] = favorited ? [...current, nftId] : current.filter((id) => id !== nftId)
    nft.favoritesCount = Math.max(0, nft.favoritesCount + (favorited ? 1 : -1))
    commit()
  }
  return HttpResponse.json<FavoriteMutationResponse>({ nftId, favorited })
}

export const favoriteHandlers = [
  http.get(
    api('/me/favorites'),
    withNetwork('favorites', ({ request }) => {
      const user = requireUser(request)
      const db = getDb()
      const ids = db.favorites[user.id] ?? []
      const items = ids.flatMap((id) => {
        const nft = db.nfts.find((item) => item.id === id)
        return nft ? [toSummary(nft)] : []
      })
      return HttpResponse.json<FavoritesResponse>({ items })
    }),
  ),

  http.put(
    api('/me/favorites/:nftId'),
    withNetwork('favorites', ({ request, params }) =>
      setFavorite(requireUser(request).id, String(params.nftId), true),
    ),
  ),

  http.delete(
    api('/me/favorites/:nftId'),
    withNetwork('favorites', ({ request, params }) =>
      setFavorite(requireUser(request).id, String(params.nftId), false),
    ),
  ),
]
