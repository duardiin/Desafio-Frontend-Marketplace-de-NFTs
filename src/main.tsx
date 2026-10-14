import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { env } from '@/config/env'
import { installSessionLifecycle } from '@/features/auth/session-lifecycle'
import { createQueryClient } from '@/lib/query-client'
import { createAppRouter } from '@/router'
import './index.css'

async function bootstrap() {
  // A camada de mocks sobe antes do primeiro request; fica em chunk separado.
  if (env.enableMocks) {
    const { startMocks } = await import('@/mocks/start')
    await startMocks()
  }

  const queryClient = createQueryClient()
  const router = createAppRouter(queryClient)
  installSessionLifecycle(router, queryClient)

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}

void bootstrap()
