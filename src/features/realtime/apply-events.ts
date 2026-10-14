import type { QueryClient, QueryKey } from '@tanstack/react-query'
import type { Cart } from '@/api/contracts/cart'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/api/contracts/events'
import type { FavoritesResponse } from '@/api/contracts/favorites'
import type { NftDetail, NftListResponse, NftSummary } from '@/api/contracts/nfts'
import type { Order } from '@/api/contracts/orders'
import { privateQueryKey } from '@/features/auth/session-query'
import { notify } from '@/features/feedback/notifications'
import { formatEth, sameEth } from '@/lib/eth'

/**
 * Aplicação dos eventos recebidos pelo socket no cache do TanStack Query.
 * Regra de ouro: só aplica se a versão do evento for MAIOR que a do dado em
 * cache, item a item. Assim um evento antigo (ou atrasado) nunca regride o
 * estado, mesmo que o dado tenha vindo do REST com versão mais nova.
 */

function isCartKey(key: QueryKey): boolean {
  return key.at(-1) === 'cart' && (key[0] === 'private' || key[0] === 'cart')
}

function isFavoritesKey(key: QueryKey): boolean {
  return key[0] === 'private' && key.at(-1) === 'favorites'
}

function patchSummary<T extends NftSummary>(item: T, event: NftUpdatedEvent): T {
  if (item.id !== event.resource.id || item.version >= event.version) return item
  const { priceEth, previousPriceEth, soldOut, version } = event.data
  return { ...item, priceEth, previousPriceEth, soldOut, version }
}

export function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent) {
  const { id } = event.resource

  // Detalhe
  queryClient.setQueryData<NftDetail>(['nfts', 'detail', id], (current) =>
    current && current.version < event.version
      ? { ...patchSummary(current, event), editions: event.data.editions }
      : current,
  )

  // Todas as listas do catálogo em cache (cada combinação de filtros)
  queryClient.setQueriesData<NftListResponse>({ queryKey: ['nfts', 'list'] }, (current) =>
    current ? { ...current, items: current.items.map((item) => patchSummary(item, event)) } : current,
  )

  // Favoritos
  queryClient.setQueriesData<FavoritesResponse>({ predicate: (query) => isFavoritesKey(query.queryKey) }, (current) =>
    current ? { items: current.items.map((item) => patchSummary(item, event)) } : current,
  )

  // Carrinho: os valores são da API (cotação). Recarrega e avisa o que mudou.
  for (const [key, cart] of queryClient.getQueriesData<Cart>({ predicate: (query) => isCartKey(query.queryKey) })) {
    const items = cart?.items.filter((item) => item.nft.id === id && item.nft.version < event.version) ?? []
    if (items.length === 0) continue

    for (const item of items) {
      if (!sameEth(item.nft.priceEth, event.data.priceEth)) {
        notify(
          `O preço de "${event.data.name}" mudou: ${formatEth(item.nft.priceEth)} → ${formatEth(event.data.priceEth)}. O resumo do pedido foi atualizado.`,
          'info',
        )
      }
    }
    // Disponibilidade: só avisa depois de recarregar o carrinho. Se a baixa veio
    // de uma compra da própria pessoa, o item já saiu do carrinho e não há o
    // que avisar ("esgotou" seria um falso alarme na tela de confirmação).
    void queryClient
      .invalidateQueries({ queryKey: key, refetchType: 'all' })
      .then(() => warnAvailability(queryClient.getQueryData<Cart>(key), event))
  }
}

function warnAvailability(cart: Cart | undefined, event: NftUpdatedEvent) {
  for (const item of cart?.items ?? []) {
    if (item.nft.id !== event.resource.id) continue
    const edition = event.data.editions.find((entry) => entry.id === item.edition.id)
    if (edition && edition.available !== null && edition.available < item.quantity) {
      notify(
        edition.available === 0
          ? `A edição ${edition.label} de "${event.data.name}" esgotou.`
          : `Restam ${edition.available} unidade(s) da edição ${edition.label} de "${event.data.name}".`,
        'error',
      )
    }
  }
}

export function applyOrderUpdated(queryClient: QueryClient, event: OrderUpdatedEvent, currentUserId: string | null) {
  // Segunda barreira (o servidor já filtra): pedido de outro usuário é descartado.
  if (!currentUserId || event.userId !== currentUserId) return

  queryClient.setQueryData<Order>(privateQueryKey(currentUserId, 'orders', event.resource.id), (current) =>
    !current || current.version < event.version ? event.data : current,
  )
  void queryClient.invalidateQueries({ queryKey: privateQueryKey(currentUserId, 'orders', 'pending') })
}

/** Ids já processados (duplicatas), com limite para não crescer sem fim. */
export class SeenEvents {
  private readonly ids = new Set<string>()
  private readonly limit: number

  constructor(limit = 500) {
    this.limit = limit
  }

  /** `true` se o evento é novo (e o registra). */
  firstTime(id: string): boolean {
    if (this.ids.has(id)) return false
    this.ids.add(id)
    if (this.ids.size > this.limit) this.ids.delete(this.ids.values().next().value as string)
    return true
  }
}
