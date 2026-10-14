import type { QueryClient } from '@tanstack/react-query'
import type { AnyRouter } from '@tanstack/react-router'
import type { Session } from '@/api/contracts/auth'
import { AUTH_TOKEN_STORAGE_KEY, authToken, onSessionRejected } from '@/api/auth-token'
import { purgePrivateCache, SESSION_QUERY_KEY } from '@/features/auth/session-query'
import { notify } from '@/features/feedback/notifications'

/** Rotas privadas ficam sob o layout `_auth`. */
export function isOnProtectedRoute(router: AnyRouter): boolean {
  return router.state.matches.some((match) => match.routeId.startsWith('/_auth'))
}

/** Rotas de autenticação não servem como destino de retorno. */
export function safeRedirect(href: string | undefined): string | undefined {
  if (!href || !href.startsWith('/') || href.startsWith('//')) return undefined
  if (/^\/(login|cadastro)(\/|\?|#|$)/.test(href)) return undefined
  return href
}

/**
 * Encerra a sessão local: token, cache privado e sessão no cache.
 * Usado no logout, na expiração e quando outra aba troca de usuário.
 */
export async function endLocalSession(queryClient: QueryClient, reason: 'logout' | 'expired' | 'switch') {
  authToken.clear(reason)
  await purgePrivateCache(queryClient)
  queryClient.setQueryData<Session | null>(SESSION_QUERY_KEY, null)
}

function redirectToLogin(router: AnyRouter, reason: 'expirada') {
  void router.navigate({
    to: '/login',
    search: { redirect: safeRedirect(router.state.location.href), motivo: reason },
    replace: true,
  })
}

/**
 * Liga a sessão aos eventos globais:
 * - 401 em chamada autenticada → sessão expirou durante o uso;
 * - prazo da sessão vencido com a aba aberta → revalida;
 * - outra aba entrou/saiu → descarta o cache privado e relê a sessão.
 */
export function installSessionLifecycle(router: AnyRouter, queryClient: QueryClient) {
  let expiryTimer: ReturnType<typeof setTimeout> | undefined
  let handlingExpiry = false

  async function handleExpired() {
    if (handlingExpiry) return
    handlingExpiry = true
    try {
      await endLocalSession(queryClient, 'expired')
      notify('Sua sessão expirou. Entre novamente para continuar.', 'info')
      if (isOnProtectedRoute(router)) redirectToLogin(router, 'expirada')
    } finally {
      handlingExpiry = false
    }
  }

  onSessionRejected(() => void handleExpired())

  // Quando a sessão muda, agenda a revalidação no instante da expiração.
  queryClient.getQueryCache().subscribe((event) => {
    if (event.query.queryHash !== JSON.stringify(SESSION_QUERY_KEY) || event.type !== 'updated') return
    clearTimeout(expiryTimer)
    const session = event.query.state.data as Session | null | undefined
    if (!session) return
    const wait = Date.parse(session.expiresAt) - Date.now()
    // setTimeout aceita no máximo ~24,8 dias.
    if (wait < 2_000_000_000) {
      expiryTimer = setTimeout(() => {
        if (authToken.get() === session.token) void handleExpired()
      }, Math.max(0, wait))
    }
  })

  window.addEventListener('storage', (event) => {
    if (event.key !== AUTH_TOKEN_STORAGE_KEY) return
    void (async () => {
      await purgePrivateCache(queryClient)
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
      const session = queryClient.getQueryData<Session | null>(SESSION_QUERY_KEY)
      if (!session && isOnProtectedRoute(router)) {
        void router.navigate({ to: '/login', search: { redirect: safeRedirect(router.state.location.href) } })
      }
    })()
  })
}
