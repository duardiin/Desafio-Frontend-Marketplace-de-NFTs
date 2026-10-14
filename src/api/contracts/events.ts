import type { IsoDateTime } from '@/api/contracts/common'
import type { NftDetail } from '@/api/contracts/nfts'
import type { Order } from '@/api/contracts/orders'

/**
 * Eventos em tempo real (Socket.IO). Cada evento tem:
 * - `id` estável: `<recurso>:<id>:v<versão>` (duplicatas têm o mesmo id);
 * - `resource` afetado e `version` do recurso após a mudança.
 * O cliente ignora duplicatas (mesmo id) e eventos antigos (versão <= a que já tem).
 */
interface RealtimeEventBase {
  id: string
  version: number
  occurredAt: IsoDateTime
}

/** Campos do NFT que mudam em tempo real (preço e disponibilidade). */
export type NftRealtimeData = Pick<
  NftDetail,
  'id' | 'name' | 'priceEth' | 'previousPriceEth' | 'editions' | 'soldOut' | 'version'
>

export interface NftUpdatedEvent extends RealtimeEventBase {
  type: 'nft.updated'
  resource: { type: 'nft'; id: string }
  data: NftRealtimeData
}

export interface OrderUpdatedEvent extends RealtimeEventBase {
  type: 'order.updated'
  resource: { type: 'order'; id: string }
  /** Dono do pedido: o servidor só envia para ele; o cliente confere de novo. */
  userId: string
  data: Order
}

export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent

/** Cliente → servidor: associa a conexão à sessão (token) ou ao visitante (null). */
export const SESSION_JOIN = 'session:join'
export interface SessionJoinPayload {
  token: string | null
}

/** Servidor → cliente: confirmação do `session:join`. */
export const SESSION_JOINED = 'session:joined'
export interface SessionJoinedPayload {
  userId: string | null
}
