import { queryOptions, useQuery, type QueryClient } from '@tanstack/react-query'
import type { Session, SessionUser } from '@/api/contracts/auth'
import { ApiError } from '@/api/api-error'
import { authToken } from '@/api/auth-token'
import { fetchSession } from '@/features/auth/api'

export const SESSION_QUERY_KEY = ['session'] as const

/**
 * Sessão atual. `null` = visitante. Um token expirado vira `null` (e o motivo
 * fica registrado para a tela de login avisar o usuário).
 */
export const sessionQueryOptions = queryOptions({
  queryKey: SESSION_QUERY_KEY,
  queryFn: async ({ signal }): Promise<Session | null> => {
    if (!authToken.get()) return null
    try {
      return await fetchSession(signal)
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'session') {
        authToken.clear('expired')
        return null
      }
      throw error
    }
  },
  staleTime: Infinity,
  gcTime: Infinity,
})

export function useSession() {
  return useQuery(sessionQueryOptions)
}

/** Usuário autenticado (ou `null`). */
export function useCurrentUser(): SessionUser | null {
  return useSession().data?.user ?? null
}

/**
 * Chave de dados privados. Todo dado de usuário fica sob ['private', userId, ...]
 * para ser descartado por inteiro no logout e na troca de usuário, e para que
 * dois usuários nunca compartilhem a mesma entrada de cache.
 */
export function privateQueryKey<const Parts extends readonly unknown[]>(userId: string, ...parts: Parts) {
  return ['private', userId, ...parts] as const
}

/** Cancela requisições em andamento e remove todo o cache privado. */
export async function purgePrivateCache(queryClient: QueryClient) {
  await queryClient.cancelQueries({ queryKey: ['private'] })
  queryClient.removeQueries({ queryKey: ['private'] })
}
