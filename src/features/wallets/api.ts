import { queryOptions } from '@tanstack/react-query'
import type { WalletListResponse } from '@/api/contracts/wallets'
import { httpClient } from '@/api/http-client'
import { privateQueryKey } from '@/features/auth/session-query'

export async function fetchWallets(signal?: AbortSignal): Promise<WalletListResponse> {
  const { data } = await httpClient.get<WalletListResponse>('/me/wallets', { signal })
  return data
}

export function walletsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: privateQueryKey(userId, 'wallets'),
    queryFn: ({ signal }) => fetchWallets(signal),
  })
}

export function shortAddress(address: string): string {
  return address.length > 14 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address
}
