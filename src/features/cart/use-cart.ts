import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { AddCartItemRequest, Cart } from '@/api/contracts/cart'
import { guestId, useGuestId } from '@/api/guest-id'
import { toApiError } from '@/api/api-error'
import { privateQueryKey, useCurrentUser } from '@/features/auth/session-query'
import * as cartApi from '@/features/cart/api'
import { notify } from '@/features/feedback/notifications'

/**
 * Chaves do carrinho por dono: conta (`['private', userId, ...]`, limpa no
 * logout) ou visitante (`['cart', 'guest', guestId]`). Dois donos nunca
 * compartilham cache.
 */
function cartKeys(userId: string | undefined, guest: string | null) {
  const base = userId ? privateQueryKey(userId, 'cart') : (['cart', 'guest', guest ?? 'sem-carrinho'] as const)
  return { cart: base, quote: [...base, 'quote'] as const }
}

export function useCartKeys() {
  const user = useCurrentUser()
  const guest = useGuestId()
  return cartKeys(user?.id, guest)
}

export function useCart() {
  const keys = useCartKeys()
  return useQuery({ queryKey: keys.cart, queryFn: ({ signal }) => cartApi.fetchCart(signal) })
}

/** Cotação da API: a única fonte de subtotal, desconto, taxa e total. */
export function useQuote({ enabled = true }: { enabled?: boolean } = {}) {
  const keys = useCartKeys()
  return useQuery({ queryKey: keys.quote, queryFn: ({ signal }) => cartApi.fetchQuote(signal), enabled })
}

export function cartItemCount(cart: Cart | undefined): number {
  return cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0
}

/** Grava o carrinho devolvido pela mutation e manda recalcular a cotação. */
function useApplyCartResult() {
  const queryClient = useQueryClient()
  const user = useCurrentUser()
  return async (cart: Cart) => {
    // Chave calculada agora: o id do visitante pode ter nascido nesta mutation.
    const keys = cartKeys(user?.id, guestId.get())
    // Uma leitura do carrinho iniciada durante a mutation responderia o estado
    // antigo DEPOIS desta gravação; cancelá-la evita sobrescrever o resultado.
    await queryClient.cancelQueries({ queryKey: keys.cart, exact: true })
    queryClient.setQueryData(keys.cart, cart)
    void queryClient.invalidateQueries({ queryKey: keys.quote })
  }
}

export function useAddToCart() {
  const applyResult = useApplyCartResult()
  const user = useCurrentUser()
  return useMutation({
    mutationFn: (body: AddCartItemRequest) => {
      // Visitante: cria o id do carrinho na primeira inclusão.
      if (!user) guestId.ensure()
      return cartApi.addCartItem(body)
    },
    onSuccess: applyResult,
  })
}

export function useUpdateCartItem() {
  const applyResult = useApplyCartResult()
  return useMutation({
    mutationFn: ({ lineId, quantity }: { lineId: string; quantity: number }) =>
      cartApi.updateCartItem(lineId, quantity),
    onSuccess: applyResult,
    onError: (error) => notify(toApiError(error).message, 'error'),
  })
}

export function useRemoveCartItem() {
  const applyResult = useApplyCartResult()
  return useMutation({
    mutationFn: ({ lineId }: { lineId: string; name: string }) => cartApi.removeCartItem(lineId),
    onSuccess: async (cart, { name }) => {
      await applyResult(cart)
      notify(`"${name}" saiu do carrinho.`, 'info')
    },
    onError: (error) => notify(toApiError(error).message, 'error'),
  })
}

export function useApplyCoupon() {
  const applyResult = useApplyCartResult()
  return useMutation({
    mutationFn: (code: string) => cartApi.applyCoupon(code),
    onSuccess: async (cart) => {
      await applyResult(cart)
      notify(`Cupom ${cart.couponCode} aplicado.`, 'success')
    },
  })
}

export function useRemoveCoupon() {
  const applyResult = useApplyCartResult()
  return useMutation({
    mutationFn: () => cartApi.removeCoupon(),
    onSuccess: async (cart) => {
      await applyResult(cart)
      notify('Cupom removido.', 'info')
    },
    onError: (error) => notify(toApiError(error).message, 'error'),
  })
}

/**
 * Ao autenticar, leva os itens do visitante para a conta (POST /cart/merge) e
 * descarta o id do visitante. Falhar aqui não impede o login.
 */
export async function mergeGuestCartIntoAccount(queryClient: QueryClient, userId: string) {
  const guest = guestId.get()
  if (!guest) return
  const guestCart = queryClient.getQueryData<Cart>(cartKeys(undefined, guest).cart)
  try {
    const merged = await cartApi.mergeGuestCart(guest)
    queryClient.setQueryData(cartKeys(userId, null).cart, merged)
    void queryClient.invalidateQueries({ queryKey: cartKeys(userId, null).quote })
    guestId.clear()
    queryClient.removeQueries({ queryKey: ['cart', 'guest'] })
    if (cartItemCount(guestCart) > 0) notify('Os itens que você escolheu antes de entrar estão no seu carrinho.', 'info')
  } catch {
    notify('Não foi possível juntar o carrinho de visitante à sua conta. Os itens continuam salvos.', 'error')
  }
}
