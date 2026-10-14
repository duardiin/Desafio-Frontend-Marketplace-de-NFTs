import type { EthAmount } from '@/api/contracts/common'
import type { NftSummary } from '@/api/contracts/nfts'

/**
 * O carrinho é do usuário autenticado (header Authorization) ou do visitante
 * (header `X-Guest-Id`, um UUID gerado no navegador).
 */
export interface CartItem {
  nft: NftSummary
  quantity: number
  /** Máximo que pode ser pedido agora (edições disponíveis e limite por pedido). */
  maxQuantity: number
  /** Preço quando o item foi adicionado; diferente de `nft.priceEth` = preço mudou. */
  priceWhenAddedEth: EthAmount
}

export interface Cart {
  items: CartItem[]
  couponCode: string | null
  /** Aumenta a cada alteração do carrinho. */
  version: number
}

/** GET /cart → 200 `Cart`. */
export type CartResponse = Cart

/** POST /cart/items → 200 `Cart` (409 EDITION_SOLD_OUT / QUANTITY_LIMIT, 404 NFT_NOT_FOUND). */
export interface AddCartItemRequest {
  nftId: string
  quantity: number
}

/** PATCH /cart/items/:nftId → 200 `Cart`. */
export interface UpdateCartItemRequest {
  quantity: number
}

/** PUT /cart/coupon → 200 `Cart` (422 COUPON_INVALID / COUPON_EXPIRED). DELETE /cart/coupon → 200 `Cart`. */
export interface ApplyCouponRequest {
  code: string
}

/** POST /cart/merge → 200 `Cart`. Exige sessão; move o carrinho do visitante para o usuário. */
export interface MergeCartRequest {
  guestId: string
}

export interface QuoteLine {
  nftId: string
  name: string
  unitPriceEth: EthAmount
  quantity: number
  lineTotalEth: EthAmount
}

/**
 * GET /cart/quote → 200 `Quote`.
 * A cotação é a referência do checkout: o pedido precisa enviar o `id` da
 * cotação vigente; se preço, disponibilidade, cupom ou taxa mudarem, o `id`
 * muda e o pedido recebe 409 QUOTE_OUTDATED.
 */
export interface Quote {
  id: string
  lines: QuoteLine[]
  subtotalEth: EthAmount
  discountEth: EthAmount
  networkFeeEth: EthAmount
  totalEth: EthAmount
  coupon: { code: string; percentOff: number } | null
  /** Itens que não podem ser comprados como estão (esgotados ou acima do limite). */
  blockers: { nftId: string; reason: 'EDITION_SOLD_OUT' | 'QUANTITY_LIMIT' }[]
}

export type QuoteResponse = Quote
