import type { EthAmount, ImageAsset, IsoDateTime, Network } from '@/api/contracts/common'
import type { WalletProvider } from '@/api/contracts/wallets'

export const ORDER_STATUSES = ['pending', 'confirmed', 'declined'] as const
/** `confirmed` e `declined` são terminais. */
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export interface Buyer {
  fullName: string
  email: string
}

/**
 * POST /orders
 * Header obrigatório: `Idempotency-Key` (UUID por tentativa de compra).
 * - mesma chave + mesmo corpo → 200 com o mesmo pedido
 * - mesma chave + corpo diferente → 409 IDEMPOTENCY_CONFLICT
 * - cotação desatualizada → 409 QUOTE_OUTDATED
 */
export interface CreateOrderRequest {
  quoteId: string
  walletId: string
  network: Network
  buyer: Buyer
}

/** Linha do pedido: snapshot no momento da compra (não muda com o catálogo). */
export interface OrderLine {
  nftId: string
  name: string
  image: ImageAsset
  unitPriceEth: EthAmount
  quantity: number
  lineTotalEth: EthAmount
}

export interface Order {
  id: string
  status: OrderStatus
  /** Aumenta a cada mudança de estado. */
  version: number
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
  lines: OrderLine[]
  subtotalEth: EthAmount
  discountEth: EthAmount
  networkFeeEth: EthAmount
  totalEth: EthAmount
  couponCode: string | null
  network: Network
  wallet: { id: string; label: string; provider: WalletProvider; address: string }
  buyer: Buyer
  /** Presente quando confirmado. Hash e link de exploração são simulados. */
  transaction: { hash: string; explorerUrl: string } | null
  /** Presente quando recusado. */
  failureReason: string | null
}

/** POST /orders → 201 (novo) ou 200 (mesma chave). GET /orders/:id → 200 (403 FORBIDDEN, 404 ORDER_NOT_FOUND). */
export type OrderResponse = Order

/** GET /orders?status=pending → 200. */
export interface OrderListResponse {
  items: Order[]
}
