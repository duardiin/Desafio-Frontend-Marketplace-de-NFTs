import axios from 'axios'
import { toApiError } from '@/api/api-error'
import { env } from '@/config/env'

/**
 * Cliente HTTP único da aplicação. Toda chamada REST passa por aqui.
 * Não contém dados fictícios: as respostas simuladas vivem só no MSW.
 */
export const httpClient = axios.create({
  baseURL: env.apiUrl,
  timeout: env.httpTimeoutMs,
  headers: { Accept: 'application/json' },
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
)
