import { isAxiosError } from 'axios'
import type { ApiErrorBody, ApiErrorKind } from '@/api/contracts/errors'

/** Erro normalizado de qualquer chamada REST feita pelo cliente Axios. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | undefined
  readonly code: string
  readonly fieldErrors: Record<string, string[]>

  constructor(params: {
    kind: ApiErrorKind
    message: string
    code: string
    status?: number
    fieldErrors?: Record<string, string[]>
    cause?: unknown
  }) {
    super(params.message, { cause: params.cause })
    this.name = 'ApiError'
    this.kind = params.kind
    this.status = params.status
    this.code = params.code
    this.fieldErrors = params.fieldErrors ?? {}
  }

  get isRetryable(): boolean {
    return this.kind === 'transient'
  }
}

export function kindFromStatus(status: number | undefined): ApiErrorKind {
  if (status === undefined) return 'transient'
  if (status === 400 || status === 422) return 'validation'
  if (status === 401) return 'session'
  if (status === 403) return 'permission'
  if (status === 404) return 'not-found'
  if (status === 409) return 'conflict'
  if (status === 408 || status === 429 || status >= 500) return 'transient'
  return 'unknown'
}

const FALLBACK_MESSAGES: Record<ApiErrorKind, string> = {
  validation: 'Confira os dados informados.',
  session: 'Sua sessão expirou. Entre novamente para continuar.',
  permission: 'Você não tem permissão para esta ação.',
  'not-found': 'Não encontramos o que você procurava.',
  conflict: 'As informações mudaram. Revise e tente de novo.',
  transient: 'Não foi possível conectar. Tente novamente.',
  unknown: 'Algo deu errado. Tente novamente.',
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ApiErrorBody).code === 'string' &&
    typeof (value as ApiErrorBody).message === 'string'
  )
}

/** Converte qualquer erro (Axios, rede, timeout) em `ApiError`. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (isAxiosError(error)) {
    const status = error.response?.status
    const kind = kindFromStatus(status)
    const body: unknown = error.response?.data

    if (isApiErrorBody(body)) {
      return new ApiError({
        kind,
        status,
        code: body.code,
        message: body.message,
        fieldErrors: body.fieldErrors,
        cause: error,
      })
    }

    return new ApiError({
      kind,
      status,
      code: status === undefined ? 'NETWORK_ERROR' : `HTTP_${status}`,
      message: FALLBACK_MESSAGES[kind],
      cause: error,
    })
  }

  return new ApiError({
    kind: 'unknown',
    code: 'UNKNOWN',
    message: FALLBACK_MESSAGES.unknown,
    cause: error,
  })
}
