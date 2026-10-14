import { useSyncExternalStore } from 'react'

export type AuthMode = 'login' | 'cadastro'

/**
 * "Balão" de login/cadastro aberto sobre a tela atual (Figma: sem trocar de
 * página). As rotas /login e /cadastro continuam existindo para acesso direto,
 * rotas protegidas e sessão expirada.
 */
let mode: AuthMode | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function openAuthDialog(next: AuthMode = 'login') {
  mode = next
  emit()
}

export function closeAuthDialog() {
  mode = null
  emit()
}

export function useAuthDialogMode(): AuthMode | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => mode,
  )
}
