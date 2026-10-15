import { replaceEqualDeep } from '@tanstack/react-query'

interface Versioned {
  id: string
  version: number
}

/**
 * Regra de versão também para respostas REST: um recurso com versão MENOR que a
 * do cache não o substitui. Cobre a corrida em que um evento (versão nova) chega
 * enquanto uma consulta iniciada antes dele (versão antiga) ainda está em voo,
 * por exemplo na reconciliação ao conectar o socket.
 *
 * Usado como `structuralSharing` das queries: recebe o dado em cache e o novo.
 */
export function keepNewerResource<T extends Versioned>(oldData: unknown, newData: unknown): T {
  const previous = oldData as T | undefined
  const next = newData as T
  if (previous && previous.id === next.id && previous.version > next.version) return previous
  return replaceEqualDeep(previous, next)
}

/** O mesmo, item a item, para respostas com `items` (listas do catálogo, favoritos). */
export function keepNewerItems<T extends { items: Versioned[] }>(oldData: unknown, newData: unknown): T {
  const previous = oldData as T | undefined
  const next = newData as T
  if (!previous) return next
  const cached = new Map(previous.items.map((item) => [item.id, item]))
  const items = next.items.map((item) => {
    const old = cached.get(item.id)
    return old && old.version > item.version ? old : item
  })
  return replaceEqualDeep(previous, { ...next, items } as T)
}
