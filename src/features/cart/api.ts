import type {
  AddCartItemRequest,
  Cart,
  Quote,
} from '@/api/contracts/cart'
import { httpClient } from '@/api/http-client'

export async function fetchCart(signal?: AbortSignal): Promise<Cart> {
  const { data } = await httpClient.get<Cart>('/cart', { signal })
  return data
}

export async function fetchQuote(signal?: AbortSignal): Promise<Quote> {
  const { data } = await httpClient.get<Quote>('/cart/quote', { signal })
  return data
}

export async function addCartItem(body: AddCartItemRequest): Promise<Cart> {
  const { data } = await httpClient.post<Cart>('/cart/items', body)
  return data
}

export async function updateCartItem(lineId: string, quantity: number): Promise<Cart> {
  const { data } = await httpClient.patch<Cart>(`/cart/items/${encodeURIComponent(lineId)}`, { quantity })
  return data
}

export async function removeCartItem(lineId: string): Promise<Cart> {
  const { data } = await httpClient.delete<Cart>(`/cart/items/${encodeURIComponent(lineId)}`)
  return data
}

export async function applyCoupon(code: string): Promise<Cart> {
  const { data } = await httpClient.put<Cart>('/cart/coupon', { code })
  return data
}

export async function removeCoupon(): Promise<Cart> {
  const { data } = await httpClient.delete<Cart>('/cart/coupon')
  return data
}

export async function mergeGuestCart(guestId: string): Promise<Cart> {
  const { data } = await httpClient.post<Cart>('/cart/merge', { guestId })
  return data
}
