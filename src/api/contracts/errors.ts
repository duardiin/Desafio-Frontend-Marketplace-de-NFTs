/**
 * Corpo de erro devolvido pela API (simulada pelo MSW).
 * O contrato completo de cada endpoint é definido no bloco P2.
 */
export interface ApiErrorBody {
  /** Código estável, legível por máquina (ex.: "CART_ITEM_UNAVAILABLE"). */
  code: string
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
