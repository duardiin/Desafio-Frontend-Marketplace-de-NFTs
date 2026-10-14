/**
 * Token da sessão (opaco, emitido pela API). Guardado no localStorage porque a
 * API simulada roda no navegador e não consegue emitir cookie httpOnly.
 * A senha nunca é guardada: só o token, que expira e é revogado no logout.
 */
export const AUTH_TOKEN_STORAGE_KEY = 'kurio:session-token'

type ClearReason = 'logout' | 'expired' | 'switch'

let lastClearReason: ClearReason | null = null
const rejectionListeners = new Set<() => void>()

export const authToken = {
  get(): string | null {
    try {
      return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
    } catch {
      return null
    }
  },
  set(token: string) {
    lastClearReason = null
    try {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
    } catch {
      // Sem storage a sessão vale só até o refresh.
    }
  },
  clear(reason: ClearReason) {
    lastClearReason = reason
    try {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    } catch {
      // Nada a limpar.
    }
  },
  /** Lê e zera o motivo da última limpeza (ex.: mostrar "sua sessão expirou" uma vez). */
  consumeClearReason(): ClearReason | null {
    const reason = lastClearReason
    lastClearReason = null
    return reason
  },
}

/** Avisado quando uma chamada autenticada recebe 401 (sessão expirada ou revogada). */
export function onSessionRejected(listener: () => void): () => void {
  rejectionListeners.add(listener)
  return () => rejectionListeners.delete(listener)
}

export function notifySessionRejected() {
  rejectionListeners.forEach((listener) => listener())
}
