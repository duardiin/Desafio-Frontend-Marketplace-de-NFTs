/**
 * Configuração de runtime lida das variáveis VITE_*.
 * Os defaults espelham o .env.example, para que um checkout limpo
 * (sem .env) suba com os mocks ativos, como o enunciado exige.
 *
 * Validação à mão (sem zod): este módulo está no carregamento inicial, e o zod
 * (~25 KB gzip) só é necessário nos formulários, que carregam sob demanda.
 * Valor inválido falha no início, com mensagem clara.
 */
type RawEnv = Record<string, string | boolean | undefined>

function invalid(name: string, value: unknown, expected: string): never {
  throw new Error(`Variável de ambiente inválida: ${name}=${String(value)} (esperado: ${expected}).`)
}

function readString(raw: RawEnv, name: string, fallback: string): string {
  const value = raw[name]
  if (value === undefined || value === '') return fallback
  if (typeof value !== 'string') invalid(name, value, 'texto')
  return value
}

function readBoolean(raw: RawEnv, name: string, fallback: boolean): boolean {
  const value = readString(raw, name, String(fallback))
  if (value !== 'true' && value !== 'false') invalid(name, value, '"true" ou "false"')
  return value === 'true'
}

function readPositiveInt(raw: RawEnv, name: string, fallback: number): number {
  const value = Number(readString(raw, name, String(fallback)))
  if (!Number.isInteger(value) || value <= 0) invalid(name, raw[name], 'inteiro positivo')
  return value
}

function readUrl(raw: RawEnv, name: string, fallback: string): string {
  const value = readString(raw, name, fallback)
  try {
    new URL(value)
  } catch {
    invalid(name, value, 'URL absoluta')
  }
  return value
}

const raw = import.meta.env as unknown as RawEnv

export const env = {
  enableMocks: readBoolean(raw, 'VITE_ENABLE_MOCKS', true),
  apiUrl: readString(raw, 'VITE_API_URL', '/api'),
  mockScenario: readString(raw, 'VITE_MOCK_SCENARIO', 'default'),
  httpTimeoutMs: readPositiveInt(raw, 'VITE_HTTP_TIMEOUT_MS', 10_000),
  // Servidor Socket.IO. Com mocks, o MSW intercepta este endereço antes da rede.
  realtimeUrl: readUrl(raw, 'VITE_REALTIME_URL', 'wss://realtime.kurio.local'),
} as const
