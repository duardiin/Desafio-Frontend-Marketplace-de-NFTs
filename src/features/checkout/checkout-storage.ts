import type { CreateOrderRequest } from '@/api/contracts/orders'
import type { CheckoutFormValues } from '@/features/checkout/schema'

/**
 * Persistência do checkout no sessionStorage (por usuário e por aba):
 * - rascunho do formulário: sobrevive a refresh e à expiração da sessão;
 * - tentativa de compra: guarda a chave de idempotência e o corpo enviado,
 *   para reenviar a MESMA tentativa após timeout ou refresh.
 */
const draftKey = (userId: string) => `kurio:checkout-draft:${userId}`
const attemptKey = (userId: string) => `kurio:checkout-attempt:${userId}`

function read<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) sessionStorage.removeItem(key)
    else sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Sem storage: o rascunho vale só enquanto a página estiver aberta.
  }
}

export const checkoutDraft = {
  load: (userId: string) => read<Partial<CheckoutFormValues>>(draftKey(userId)),
  save: (userId: string, values: Partial<CheckoutFormValues>) => write(draftKey(userId), values),
  clear: (userId: string) => write(draftKey(userId), null),
}

interface PurchaseAttempt {
  key: string
  body: CreateOrderRequest
}

export const purchaseAttempt = {
  /**
   * Chave da tentativa: reaproveita a anterior se o corpo for idêntico
   * (clique repetido, timeout, refresh); corpo diferente = nova tentativa.
   */
  keyFor(userId: string, body: CreateOrderRequest): string {
    const current = read<PurchaseAttempt>(attemptKey(userId))
    if (current && JSON.stringify(current.body) === JSON.stringify(body)) return current.key
    const key = crypto.randomUUID()
    write(attemptKey(userId), { key, body })
    return key
  },
  /** Tentativa pendente (enviada sem resposta conclusiva). */
  load: (userId: string) => read<PurchaseAttempt>(attemptKey(userId)),
  clear: (userId: string) => write(attemptKey(userId), null),
}
