import type { EthAmount, IsoDateTime, Network } from '@/api/contracts/common'
import type { NftDetail } from '@/api/contracts/nfts'
import type { Order } from '@/api/contracts/orders'
import type { Wallet } from '@/api/contracts/wallets'

/** Registros internos do "servidor" simulado. Nunca saem da camada de mocks como estão. */

export interface UserRecord {
  id: string
  displayName: string
  username: string
  email: string
  bio: string
  avatarUrl: string | null
  passwordSalt: string
  passwordHash: string
}

export interface SessionRecord {
  token: string
  userId: string
  expiresAt: IsoDateTime
}

export type NftRecord = NftDetail

export interface CartLineRecord {
  nftId: string
  editionId: string
  quantity: number
  priceWhenAddedEth: EthAmount
}

/** Dono do carrinho: `user:<id>` ou `guest:<uuid>`. */
export type CartOwner = `user:${string}` | `guest:${string}`

export interface CartRecord {
  lines: CartLineRecord[]
  couponCode: string | null
  version: number
}

export interface WalletRecord extends Wallet {
  userId: string
}

export interface OrderRecord extends Order {
  userId: string
  /** Momento em que a simulação de pagamento resolve o pedido. */
  settleAt: IsoDateTime
  /** Resultado decidido na criação (depende do cenário ativo). */
  plannedOutcome: 'confirmed' | 'declined'
}

export interface IdempotencyRecord {
  userId: string
  requestHash: string
  orderId: string
}

export interface WalletConnectionRecord {
  id: string
  userId: string
  walletId: string
  network: Network
  expiresAt: IsoDateTime
}

export interface CouponRecord {
  code: string
  percentOff: number
  expiresAt: IsoDateTime
}

export interface MockDb {
  schemaVersion: number
  users: UserRecord[]
  sessions: SessionRecord[]
  nfts: NftRecord[]
  favorites: Record<string, string[]>
  carts: Record<CartOwner, CartRecord>
  wallets: WalletRecord[]
  orders: OrderRecord[]
  idempotency: Record<string, IdempotencyRecord>
  walletConnections: WalletConnectionRecord[]
  coupons: CouponRecord[]
}

/** Mudanças relevantes para eventos em tempo real (consumidas no bloco de Socket.IO). */
export type DbChange =
  | { type: 'nft.updated'; nftId: string }
  | { type: 'order.updated'; orderId: string }
  | { type: 'reset' }
