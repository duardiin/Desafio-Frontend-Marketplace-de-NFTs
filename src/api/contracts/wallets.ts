import type { Network } from '@/api/contracts/common'

export const WALLET_PROVIDERS = ['metamask', 'walletconnect', 'coinbase'] as const
export type WalletProvider = (typeof WALLET_PROVIDERS)[number]

export const WALLET_PROVIDER_LABELS: Record<WalletProvider, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase',
}

/** Cada usuário tem no máximo uma carteira principal e uma secundária. */
export type WalletRole = 'principal' | 'secundaria'

export interface Wallet {
  id: string
  label: string
  provider: WalletProvider
  /** EVM: 0x + 40 hex. Solana: base58 de 32 a 44 caracteres. */
  address: string
  networks: Network[]
  role: WalletRole
}

/** GET /me/wallets → 200. */
export interface WalletListResponse {
  items: Wallet[]
}

/** POST /me/wallets → 201 `Wallet` (409 WALLET_LIMIT, 422 VALIDATION_FAILED). */
export interface CreateWalletRequest {
  label: string
  provider: WalletProvider
  address: string
  networks: Network[]
  role: WalletRole
}

/**
 * PATCH /me/wallets/:id → 200 `WalletListResponse` (trocar o papel pode
 * rebaixar a outra carteira). 403 FORBIDDEN se a carteira for de outro usuário.
 */
export type UpdateWalletRequest = Partial<CreateWalletRequest>
