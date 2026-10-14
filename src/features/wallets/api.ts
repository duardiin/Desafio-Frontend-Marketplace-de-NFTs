import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  CreateWalletRequest,
  UpdateWalletRequest,
  Wallet,
  WalletListResponse,
} from '@/api/contracts/wallets'
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

export const walletsApi = {
  create: async (body: CreateWalletRequest) => (await httpClient.post<Wallet>('/me/wallets', body)).data,
  update: async ({ id, ...body }: UpdateWalletRequest & { id: string }) =>
    (await httpClient.patch<WalletListResponse>(`/me/wallets/${id}`, body)).data,
}

export function useCreateWallet(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: walletsApi.create,
    // A lista volta ordenada da API (principal primeiro): recarrega em vez de inserir no cache.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: walletsQueryOptions(userId).queryKey }),
  })
}

export function useUpdateWallet(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: walletsApi.update,
    // O PATCH devolve a lista inteira: trocar o papel também muda a outra carteira.
    onSuccess: (list) => queryClient.setQueryData(walletsQueryOptions(userId).queryKey, list),
  })
}

export function shortAddress(address: string): string {
  return address.length > 14 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address
}
