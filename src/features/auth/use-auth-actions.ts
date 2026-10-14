import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import type { LoginRequest, RegisterRequest, Session } from '@/api/contracts/auth'
import { authToken } from '@/api/auth-token'
import * as authApi from '@/features/auth/api'
import { purgePrivateCache, SESSION_QUERY_KEY } from '@/features/auth/session-query'
import { endLocalSession, isOnProtectedRoute } from '@/features/auth/session-lifecycle'
import { notify } from '@/features/feedback/notifications'

/** Grava a nova sessão. Sempre descarta o cache privado anterior (troca de usuário). */
async function startSession(queryClient: ReturnType<typeof useQueryClient>, session: Session) {
  await purgePrivateCache(queryClient)
  authToken.set(session.token)
  queryClient.setQueryData<Session | null>(SESSION_QUERY_KEY, session)
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: async (session) => {
      await startSession(queryClient, session)
      notify(`Olá, ${session.user.displayName.split(' ')[0]}! Você entrou na sua conta.`, 'success')
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: RegisterRequest) => authApi.register(body),
    onSuccess: async (session) => {
      await startSession(queryClient, session)
      notify(`Conta criada. Bem-vindo(a), ${session.user.displayName.split(' ')[0]}!`, 'success')
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    // Falha ao avisar o servidor não impede sair: a sessão local é encerrada de qualquer forma.
    mutationFn: () => authApi.logout().catch(() => undefined),
    onSettled: async () => {
      // Sai da área privada antes de limpar, para a tela não renderizar sem usuário.
      if (isOnProtectedRoute(router)) await router.navigate({ to: '/', replace: true })
      await endLocalSession(queryClient, 'logout')
      notify('Você saiu da sua conta.', 'info')
    },
  })
}
