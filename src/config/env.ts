import { z } from 'zod'

/**
 * Configuração de runtime lida das variáveis VITE_*.
 * Os defaults espelham o .env.example, para que um checkout limpo
 * (sem .env) suba com os mocks ativos, como o enunciado exige.
 */
const envSchema = z.object({
  VITE_ENABLE_MOCKS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  VITE_API_URL: z.string().min(1).default('/api'),
  VITE_MOCK_SCENARIO: z.string().min(1).default('default'),
  VITE_HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  // Servidor Socket.IO. Com mocks, o MSW intercepta este endereço antes da rede.
  VITE_REALTIME_URL: z.string().url().default('wss://realtime.kurio.local'),
})

const parsed = envSchema.parse(import.meta.env)

export const env = {
  enableMocks: parsed.VITE_ENABLE_MOCKS,
  apiUrl: parsed.VITE_API_URL,
  mockScenario: parsed.VITE_MOCK_SCENARIO,
  httpTimeoutMs: parsed.VITE_HTTP_TIMEOUT_MS,
  realtimeUrl: parsed.VITE_REALTIME_URL,
} as const
