import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { authToken } from '@/api/auth-token'
import { sessionQueryOptions } from '@/features/auth/session-query'
import { safeRedirect } from '@/features/auth/session-lifecycle'

/**
 * Layout das rotas privadas (checkout, perfil, carteiras, favoritos, pedidos).
 * A cada navegação a sessão é revalidada na API: expiração durante a navegação
 * leva ao login, com retorno para a mesma tela.
 */
export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.fetchQuery({ ...sessionQueryOptions, staleTime: 0 })
    if (!session) {
      const expired = authToken.consumeClearReason() === 'expired'
      throw redirect({
        to: '/login',
        search: { redirect: safeRedirect(location.href), motivo: expired ? 'expirada' : undefined },
        replace: true,
      })
    }
    return { session }
  },
  component: Outlet,
})
