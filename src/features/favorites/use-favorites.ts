import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FavoritesResponse } from '@/api/contracts/favorites'
import type { NftSummary } from '@/api/contracts/nfts'
import { useCurrentUser } from '@/features/auth/session-query'
import { favoritesQueryKey, favoritesQueryOptions, setFavorite } from '@/features/favorites/api'
import { notify } from '@/features/feedback/notifications'

/** Ids favoritados pelo usuário atual (vazio para visitante). */
export function useFavoriteIds(): Set<string> {
  const user = useCurrentUser()
  const favorites = useQuery({ ...favoritesQueryOptions(user?.id ?? ''), enabled: Boolean(user) })
  return new Set(favorites.data?.items.map((item) => item.id) ?? [])
}

interface ToggleVariables {
  nft: NftSummary
  favorited: boolean
}

/**
 * Favoritar com atualização otimista: a lista muda na hora; se a API falhar,
 * volta ao estado anterior e avisa. Ao final, sincroniza com o servidor.
 */
export function useToggleFavorite() {
  const user = useCurrentUser()
  const queryClient = useQueryClient()
  const key = favoritesQueryKey(user?.id ?? '')

  return useMutation({
    mutationKey: ['favorites', 'toggle'],
    mutationFn: ({ nft, favorited }: ToggleVariables) => setFavorite(nft.id, favorited),
    onMutate: async ({ nft, favorited }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<FavoritesResponse>(key)
      queryClient.setQueryData<FavoritesResponse>(key, (current) => {
        const items = (current?.items ?? []).filter((item) => item.id !== nft.id)
        return { items: favorited ? [...items, nft] : items }
      })
      return { previous }
    },
    onError: (_error, { nft, favorited }, context) => {
      queryClient.setQueryData(key, context?.previous)
      notify(
        favorited
          ? `Não foi possível favoritar "${nft.name}". A alteração foi desfeita.`
          : `Não foi possível remover "${nft.name}" dos favoritos. A alteração foi desfeita.`,
        'error',
      )
    },
    onSuccess: (_data, { nft, favorited }) => {
      notify(favorited ? `"${nft.name}" foi adicionado aos favoritos.` : `"${nft.name}" saiu dos favoritos.`, 'success')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
