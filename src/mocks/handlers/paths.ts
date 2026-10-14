import { env } from '@/config/env'

/**
 * Caminho completo de um endpoint, a partir da mesma base do cliente Axios.
 * Base relativa ("/api") vira um padrão relativo ao site, como o MSW espera.
 */
export function api(path: string): string {
  return `${env.apiUrl.replace(/\/$/, '')}${path}`
}
