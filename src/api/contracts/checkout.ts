import type { IsoDateTime, Network } from '@/api/contracts/common'

/**
 * POST /checkout/wallet-connection → 201 `WalletConnection`.
 * Simula a conexão com a extensão/app da carteira (sem blockchain real).
 * 403 FORBIDDEN (carteira de outro usuário), 409 WALLET_NETWORK_MISMATCH,
 * 409 WALLET_REJECTED (o usuário recusou na carteira).
 */
export interface WalletConnectionRequest {
  walletId: string
  network: Network
}

export interface WalletConnection {
  id: string
  walletId: string
  network: Network
  address: string
  expiresAt: IsoDateTime
}

/** DELETE /checkout/wallet-connection/:id → 204 (desconectar). */
export type WalletConnectionResponse = WalletConnection
