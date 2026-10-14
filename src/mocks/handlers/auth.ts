import { http, HttpResponse } from 'msw'
import type { LoginRequest, RegisterRequest, Session } from '@/api/contracts/auth'
import { commit, getDb } from '@/mocks/db/store'
import type { UserRecord } from '@/mocks/db/schema'
import { hashPassword, randomSalt } from '@/mocks/lib/hash'
import { apiError, lookupSession, readJson, validationError } from '@/mocks/lib/http'
import { validateDisplayName, validateEmail, validateNewPassword } from '@/mocks/lib/validation'
import { withNetwork } from '@/mocks/network'
import { getActiveScenario } from '@/mocks/scenarios'
import { api } from '@/mocks/handlers/paths'

const SESSION_TTL_MS = 2 * 60 * 60 * 1000
const SHORT_SESSION_TTL_MS = 30 * 1000

function createSession(user: UserRecord): Session {
  const db = getDb()
  const ttl = getActiveScenario() === 'sessao-expirada' ? SHORT_SESSION_TTL_MS : SESSION_TTL_MS
  const session = {
    token: crypto.randomUUID(),
    userId: user.id,
    expiresAt: new Date(Date.now() + ttl).toISOString(),
  }
  db.sessions.push(session)
  commit()
  return { token: session.token, expiresAt: session.expiresAt, user: toSessionUser(user) }
}

export function toSessionUser(user: UserRecord): Session['user'] {
  return { id: user.id, displayName: user.displayName, email: user.email, avatarUrl: user.avatarUrl }
}

function usernameFromEmail(email: string, taken: Set<string>): string {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 16) || 'colecionador'
  let candidate = base.length >= 3 ? base : `${base}kurio`
  for (let i = 2; taken.has(candidate); i++) candidate = `${base}${i}`
  return candidate
}

export const authHandlers = [
  http.post(
    api('/auth/register'),
    withNetwork('auth', async ({ request }) => {
      const body = await readJson<RegisterRequest>(request)
      const fieldErrors = {
        ...validateDisplayName(body.displayName),
        ...validateEmail(body.email),
        ...validateNewPassword(body.password, 'password'),
      }
      if (Object.keys(fieldErrors).length > 0) return validationError(fieldErrors)

      const db = getDb()
      const email = String(body.email).trim().toLowerCase()
      if (db.users.some((user) => user.email === email)) {
        return apiError(409, 'EMAIL_TAKEN', 'Este e-mail já está cadastrado.', {
          email: ['Este e-mail já está cadastrado. Entre ou use outro e-mail.'],
        })
      }

      const salt = randomSalt()
      const user: UserRecord = {
        id: `usr-${crypto.randomUUID().slice(0, 8)}`,
        displayName: String(body.displayName).trim(),
        username: usernameFromEmail(email, new Set(db.users.map((item) => item.username))),
        email,
        bio: '',
        avatarUrl: null,
        passwordSalt: salt,
        passwordHash: await hashPassword(String(body.password), salt),
      }
      db.users.push(user)
      return HttpResponse.json(createSession(user), { status: 201 })
    }),
  ),

  http.post(
    api('/auth/login'),
    withNetwork('auth', async ({ request }) => {
      const body = await readJson<LoginRequest>(request)
      const email = String(body.email ?? '').trim().toLowerCase()
      const user = getDb().users.find((item) => item.email === email)
      const valid = user && (await hashPassword(String(body.password ?? ''), user.passwordSalt)) === user.passwordHash

      if (!user || !valid) {
        return apiError(422, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
      }
      return HttpResponse.json(createSession(user))
    }),
  ),

  http.get(
    api('/auth/session'),
    withNetwork('auth', ({ request }) => {
      const session = lookupSession(request)
      if (session.status === 'missing') {
        return apiError(401, 'SESSION_REQUIRED', 'Nenhuma sessão ativa.')
      }
      if (session.status === 'expired') {
        return apiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar.')
      }
      const record = getDb().sessions.find((item) => item.token === session.token)
      return HttpResponse.json<Session>({
        token: session.token,
        expiresAt: record?.expiresAt ?? new Date().toISOString(),
        user: toSessionUser(session.user),
      })
    }),
  ),

  http.post(
    api('/auth/logout'),
    withNetwork('auth', ({ request }) => {
      const session = lookupSession(request)
      if (session.status === 'ok') {
        const db = getDb()
        db.sessions = db.sessions.filter((item) => item.token !== session.token)
        commit()
      }
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
