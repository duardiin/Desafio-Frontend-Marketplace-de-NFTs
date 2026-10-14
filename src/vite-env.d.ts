/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_MOCKS?: 'true' | 'false'
  readonly VITE_API_URL?: string
  readonly VITE_MOCK_SCENARIO?: string
  readonly VITE_HTTP_TIMEOUT_MS?: string
  readonly VITE_REALTIME_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
