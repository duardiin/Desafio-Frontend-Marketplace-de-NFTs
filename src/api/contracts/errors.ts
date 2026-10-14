/**
 * Códigos de erro estáveis devolvidos pela API (simulada pelo MSW).
 * A UI decide a mensagem e a ação a partir do `kind` (ver ApiErrorKind)
 * e, quando precisa de detalhe, do `code`.
 */
export type ApiErrorCode =
  // 400/422 · validação
  | 'VALIDATION_FAILED'
  | 'COUPON_INVALID'
  | 'COUPON_EXPIRED'
  | 'INVALID_CREDENTIALS'
  | 'WRONG_PASSWORD'
  // 401 · sessão
  | 'SESSION_REQUIRED'
  | 'SESSION_EXPIRED'
  // 403 · permissão
  | 'FORBIDDEN'
  // 404 · inexistente
  | 'NFT_NOT_FOUND'
  | 'CART_ITEM_NOT_FOUND'
  | 'ORDER_NOT_FOUND'
  | 'WALLET_NOT_FOUND'
  | 'NOT_FOUND'
  // 409 · conflito
  | 'EMAIL_TAKEN'
  | 'EDITION_SOLD_OUT'
  | 'QUANTITY_LIMIT'
  | 'QUOTE_OUTDATED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'WALLET_LIMIT'
  | 'WALLET_NETWORK_MISMATCH'
  | 'WALLET_REJECTED'
  | 'WALLET_DISCONNECTED'
  // 5xx · transitório
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'

/** Corpo de erro devolvido pela API. */
export interface ApiErrorBody {
  code: ApiErrorCode
  /** Mensagem em pt-BR, apresentável ao usuário. */
  message: string
  /** Erros de validação por campo (formulários). */
  fieldErrors?: Record<string, string[]>
}

/**
 * Categorias de erro que a UI trata de forma diferente.
 * - validation: 400/422, corrigir dados e reenviar
 * - session: 401, sessão ausente ou expirada
 * - permission: 403, sem permissão para o recurso
 * - not-found: 404, recurso inexistente
 * - conflict: 409, estado mudou (ex.: preço, idempotência)
 * - transient: rede, timeout, 408, 429 e 5xx, pode tentar de novo
 * - unknown: qualquer outro caso
 */
export type ApiErrorKind =
  | 'validation'
  | 'session'
  | 'permission'
  | 'not-found'
  | 'conflict'
  | 'transient'
  | 'unknown'
