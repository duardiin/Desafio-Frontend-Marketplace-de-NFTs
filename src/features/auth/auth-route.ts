import { redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import type { AuthSearch } from '@/features/auth/auth-dialog'
import { sessionQueryOptions } from '@/features/auth/session-query'
import { safeRedirect } from '@/features/auth/session-lifecycle'

/** Search params de /login e /cadastro. Só aceita destinos internos (evita open redirect). */
export function validateAuthSearch(search: Record<string, unknown>): AuthSearch {
  return {
    redirect: typeof search.redirect === 'string' ? safeRedirect(search.redirect) : undefined,
    motivo: search.motivo === 'expirada' ? 'expirada' : undefined,
  }
}

/** Quem já está autenticado não vê login/cadastro: segue para o destino. */
export async function redirectIfAuthenticated(queryClient: QueryClient, search: AuthSearch) {
  const session = await queryClient.ensureQueryData(sessionQueryOptions)
  if (session) throw redirect({ href: search.redirect ?? '/', replace: true })
}
