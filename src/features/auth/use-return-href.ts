import { useLocation } from '@tanstack/react-router'
import { safeRedirect } from '@/features/auth/session-lifecycle'

/** Destino de retorno do login: a tela atual (exceto as próprias telas de autenticação). */
export function useReturnHref(): string | undefined {
  return safeRedirect(useLocation({ select: (location) => location.href }))
}
