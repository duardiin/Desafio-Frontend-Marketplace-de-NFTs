import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/api-error'

const MAX_RETRIES = 2

/** Só repete erros transitórios (rede, timeout, 408, 429, 5xx). */
function shouldRetry(failureCount: number, error: unknown): boolean {
  return error instanceof ApiError && error.isRetryable && failureCount < MAX_RETRIES
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetry,
        refetchOnWindowFocus: true,
      },
      mutations: {
        // Mutations não são repetidas automaticamente: pedidos dependem de
        // chave de idempotência e o usuário decide quando tentar de novo.
        retry: false,
      },
    },
  })
}
