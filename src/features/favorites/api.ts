import { queryOptions } from '@tanstack/react-query'
import type { FavoriteMutationResponse, FavoritesResponse } from '@/api/contracts/favorites'
import { httpClient } from '@/api/http-client'
import { privateQueryKey } from '@/features/auth/session-query'
import { keepNewerItems } from '@/lib/versioned-cache'

export async function fetchFavorites(signal?: AbortSignal): Promise<FavoritesResponse> {
  const { data } = await httpClient.get<FavoritesResponse>('/me/favorites', { signal })
  return data
}

export async function setFavorite(nftId: string, favorited: boolean): Promise<FavoriteMutationResponse> {
  const path = `/me/favorites/${encodeURIComponent(nftId)}`
  const { data } = favorited
    ? await httpClient.put<FavoriteMutationResponse>(path)
    : await httpClient.delete<FavoriteMutationResponse>(path)
  return data
}

export function favoritesQueryKey(userId: string) {
  return privateQueryKey(userId, 'favorites')
}

export function favoritesQueryOptions(userId: string) {
  return queryOptions({
    queryKey: favoritesQueryKey(userId),
    queryFn: ({ signal }) => fetchFavorites(signal),
    structuralSharing: keepNewerItems<FavoritesResponse>,
  })
}
