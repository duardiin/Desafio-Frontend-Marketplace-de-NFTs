import { HttpResponse } from 'msw'
import type { ApiErrorBody, ApiErrorCode } from '@/api/contracts/errors'
import { getDb, commit } from '@/mocks/db/store'
import type { CartOwner, UserRecord } from '@/mocks/db/schema'

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>,
) {
  return HttpResponse.json<ApiErrorBody>({ code, message, fieldErrors }, { status })
}

/** Erro de validação com mensagens por campo. */
export function validationError(fieldErrors: Record<string, string[]>) {
  return apiError(422, 'VALIDATION_FAILED', 'Confira os campos destacados.', fieldErrors)
}

export async function readJson<T>(request: Request): Promise<Partial<T>> {
  try {
    const body: unknown = await request.json()
    return typeof body === 'object' && body !== null ? (body as Partial<T>) : {}
  } catch {
    return {}
  }
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
}

type SessionLookup =
  | { status: 'ok'; user: UserRecord; token: string }
  | { status: 'missing' }
  | { status: 'expired' }

export function lookupSession(request: Request): SessionLookup {
  const token = bearerToken(request)
  if (!token) return { status: 'missing' }

  const db = getDb()
  const session = db.sessions.find((item) => item.token === token)
  if (!session) return { status: 'expired' }

  if (Date.parse(session.expiresAt) <= Date.now()) {
    db.sessions = db.sessions.filter((item) => item.token !== token)
    commit()
    return { status: 'expired' }
  }

  const user = db.users.find((item) => item.id === session.userId)
  return user ? { status: 'ok', user, token } : { status: 'expired' }
}

/**
 * Exige sessão válida. Lança a resposta 401 (o MSW aceita `throw` de Response
 * dentro do resolver), para manter os handlers lineares.
 */
export function requireUser(request: Request): UserRecord {
  const session = lookupSession(request)
  if (session.status === 'ok') return session.user
  if (session.status === 'expired') {
    throw apiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar.')
  }
  throw apiError(401, 'SESSION_REQUIRED', 'Entre na sua conta para continuar.')
}

/**
 * Dono do carrinho: usuário autenticado ou visitante (`X-Guest-Id`).
 * Um token inválido não cai para o carrinho de visitante: responde 401.
 */
export function cartOwner(request: Request): CartOwner | null {
  if (bearerToken(request)) return `user:${requireUser(request).id}`
  const guestId = request.headers.get('X-Guest-Id')
  return guestId && /^[0-9a-f-]{36}$/i.test(guestId) ? `guest:${guestId}` : null
}

export function nowIso(): string {
  return new Date().toISOString()
}
