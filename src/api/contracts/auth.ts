import type { IsoDateTime } from '@/api/contracts/common'

/** Dados públicos do usuário autenticado (nunca inclui senha ou hash). */
export interface SessionUser {
  id: string
  displayName: string
  email: string
  avatarUrl: string | null
}

export interface Session {
  /** Token opaco enviado em `Authorization: Bearer <token>`. */
  token: string
  expiresAt: IsoDateTime
  user: SessionUser
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  displayName: string
  email: string
  password: string
}

/** POST /auth/login e POST /auth/register → 200/201 `Session`. */
export type LoginResponse = Session
export type RegisterResponse = Session

/** GET /auth/session → 200 `Session` (401 SESSION_REQUIRED / SESSION_EXPIRED). */
export type SessionResponse = Session
