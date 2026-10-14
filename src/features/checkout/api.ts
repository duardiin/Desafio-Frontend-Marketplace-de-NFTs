import { queryOptions } from '@tanstack/react-query'
import type { WalletConnection, WalletConnectionRequest } from '@/api/contracts/checkout'
import type { CreateOrderRequest, Order, OrderListResponse } from '@/api/contracts/orders'
import { httpClient } from '@/api/http-client'
import { privateQueryKey } from '@/features/auth/session-query'

export async function connectWallet(body: WalletConnectionRequest): Promise<WalletConnection> {
  const { data } = await httpClient.post<WalletConnection>('/checkout/wallet-connection', body)
  return data
}

export async function disconnectWallet(connectionId: string): Promise<void> {
  await httpClient.delete(`/checkout/wallet-connection/${encodeURIComponent(connectionId)}`)
}

/** Cria o pedido. A mesma chave de idempotência sempre devolve o mesmo pedido. */
export async function createOrder(body: CreateOrderRequest, idempotencyKey: string): Promise<Order> {
  const { data } = await httpClient.post<Order>('/orders', body, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return data
}

export async function fetchOrder(id: string, signal?: AbortSignal): Promise<Order> {
  const { data } = await httpClient.get<Order>(`/orders/${encodeURIComponent(id)}`, { signal })
  return data
}

export async function fetchPendingOrders(signal?: AbortSignal): Promise<OrderListResponse> {
  const { data } = await httpClient.get<OrderListResponse>('/orders', { params: { status: 'pending' }, signal })
  return data
}

export function orderQueryOptions(userId: string, orderId: string) {
  return queryOptions({
    queryKey: privateQueryKey(userId, 'orders', orderId),
    queryFn: ({ signal }) => fetchOrder(orderId, signal),
  })
}

export function pendingOrdersQueryOptions(userId: string) {
  return queryOptions({
    queryKey: privateQueryKey(userId, 'orders', 'pending'),
    queryFn: ({ signal }) => fetchPendingOrders(signal),
  })
}
