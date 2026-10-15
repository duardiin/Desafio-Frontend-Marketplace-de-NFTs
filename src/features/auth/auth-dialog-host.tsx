import { lazy, Suspense } from 'react'
import { useAuthDialogMode } from '@/features/auth/auth-dialog-store'

// Carregado só quando alguém abre o login: os formulários (react-hook-form + zod)
// não entram no carregamento inicial de todas as páginas.
const AuthDialogOverlay = lazy(() =>
  import('@/features/auth/auth-dialog').then((module) => ({ default: module.AuthDialogOverlay })),
)

/** Balão/tela de login aberto pelo "Entrar" sobre a tela atual (fechar ou entrar mantém a página). */
export function AuthDialogHost() {
  const mode = useAuthDialogMode()
  if (!mode) return null
  return (
    <Suspense fallback={null}>
      <AuthDialogOverlay mode={mode} />
    </Suspense>
  )
}
