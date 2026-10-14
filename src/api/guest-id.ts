import { useSyncExternalStore } from 'react'

/**
 * Identificador do carrinho de visitante (UUID gerado no navegador), enviado
 * em `X-Guest-Id`. É criado no primeiro "adicionar ao carrinho" e trocado
 * depois que os itens são levados para a conta (login/cadastro).
 */
const STORAGE_KEY = 'kurio:guest-id'
const listeners = new Set<() => void>()

function read(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function write(value: string | null) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Sem storage o carrinho de visitante vale só nesta página.
  }
  listeners.forEach((listener) => listener())
}

export const guestId = {
  get: read,
  /** Garante um id (cria se ainda não existe). */
  ensure(): string {
    const current = read()
    if (current) return current
    const created = crypto.randomUUID()
    write(created)
    return created
  },
  /** Descarta o id atual: o próximo carrinho de visitante começa vazio. */
  clear() {
    write(null)
  },
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Id atual do visitante, reativo (muda ao criar ou descartar). */
export function useGuestId(): string | null {
  return useSyncExternalStore(subscribe, read)
}
