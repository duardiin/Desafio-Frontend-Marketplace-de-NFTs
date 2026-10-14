import type { LoginRequest, RegisterRequest, Session } from '@/api/contracts/auth'
import { httpClient } from '@/api/http-client'

export async function fetchSession(signal?: AbortSignal): Promise<Session> {
  const { data } = await httpClient.get<Session>('/auth/session', { signal })
  return data
}

export async function login(body: LoginRequest): Promise<Session> {
  const { data } = await httpClient.post<Session>('/auth/login', body)
  return data
}

export async function register(body: RegisterRequest): Promise<Session> {
  const { data } = await httpClient.post<Session>('/auth/register', body)
  return data
}

export async function logout(): Promise<void> {
  await httpClient.post('/auth/logout')
}
