import axios from 'axios'
import { ApiError, toApiError } from '@/api/api-error'
import { authToken, notifySessionRejected } from '@/api/auth-token'
import { guestId } from '@/api/guest-id'
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

httpClient.interceptors.request.use((config) => {
  const token = authToken.get()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  // Carrinho de visitante. Com sessão, a API usa o carrinho da conta.
  const guest = guestId.get()
  if (guest && !token) config.headers.set('X-Guest-Id', guest)
  return config
})

/**
 * A API responde JSON. Uma página HTML no lugar dela (ex.: o fallback de SPA do
 * servidor quando a requisição não chega à API) é falha de infraestrutura, não
 * dado: vira erro transitório, que as consultas repetem sozinhas.
 */
function isHtmlResponse(headers: unknown): boolean {
  const contentType = (headers as { 'content-type'?: unknown } | undefined)?.['content-type']
  return typeof contentType === 'string' && contentType.includes('text/html')
}

function unreachableApi(cause: unknown) {
  return new ApiError({
    kind: 'transient',
    code: 'API_UNREACHABLE',
    message: 'Não foi possível falar com o servidor. Tente novamente.',
    cause,
  })
}

httpClient.interceptors.response.use(
  (response) => (isHtmlResponse(response.headers) ? Promise.reject(unreachableApi(response)) : response),
  (error: unknown) => {
    if (axios.isAxiosError(error) && isHtmlResponse(error.response?.headers)) return Promise.reject(unreachableApi(error))
    const apiError = toApiError(error)
    const config = axios.isAxiosError(error) ? error.config : undefined
    const sentToken = Boolean(config?.headers?.Authorization)
    const isAuthEndpoint = config?.url?.startsWith('/auth/') ?? false

    // 401 numa chamada autenticada = sessão expirada/revogada durante o uso.
    // Endpoints de /auth tratam o próprio 401 (ex.: consulta da sessão no carregamento).
    if (apiError.kind === 'session' && sentToken && !isAuthEndpoint) notifySessionRejected()

    return Promise.reject(apiError)
  },
)
