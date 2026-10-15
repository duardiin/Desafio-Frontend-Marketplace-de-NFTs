import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { NftDetail, NftListParams, NftListResponse } from '@/api/contracts/nfts'
import { httpClient } from '@/api/http-client'
import { keepNewerItems, keepNewerResource } from '@/lib/versioned-cache'

export async function fetchNfts(params: NftListParams, signal?: AbortSignal): Promise<NftListResponse> {
  const { data } = await httpClient.get<NftListResponse>('/nfts', {
    params,
    // Listas repetem a chave (`collection=a&collection=b`), como no contrato.
    paramsSerializer: { indexes: null },
    signal,
  })
  return data
}

export async function fetchNft(id: string, signal?: AbortSignal): Promise<NftDetail> {
  const { data } = await httpClient.get<NftDetail>(`/nfts/${encodeURIComponent(id)}`, { signal })
  return data
}

/**
 * Catálogo. A chave inclui todos os parâmetros: cada combinação tem seu cache e
 * uma resposta atrasada de outra combinação nunca substitui a tela atual.
 * O `signal` cancela a requisição quando a combinação deixa de ser usada.
 */
export function catalogQueryOptions(params: NftListParams) {
  return queryOptions({
    queryKey: ['nfts', 'list', params],
    queryFn: ({ signal }) => fetchNfts(params, signal),
    // Mostra o resultado anterior (atenuado) enquanto o novo carrega.
    placeholderData: keepPreviousData,
    // Resposta com versão menor que a do cache (ex.: evento chegou antes) não regride o item.
    structuralSharing: keepNewerItems<NftListResponse>,
  })
}

export function nftDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['nfts', 'detail', id],
    queryFn: ({ signal }) => fetchNft(id, signal),
    structuralSharing: keepNewerResource<NftDetail>,
  })
}
