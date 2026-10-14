import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { NotFoundPage } from '@/features/layout/not-found-page'
import { PageSkeleton } from '@/features/layout/page-skeleton'
import { RouteErrorPage } from '@/features/layout/route-error-page'
import { routeTree } from '@/routeTree.gen'

/**
 * Search params como texto simples (`?colecao=musica,arte-3d&pagina=2`), sem o
 * JSON padrão do router (que poria aspas em "0.5"). Cada rota converte e valida
 * os próprios parâmetros no `validateSearch`.
 */
function parseSearch(searchString: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(searchString))
}

function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  // Vírgula é válida na query string; mantê-la deixa as listas legíveis.
  const text = params.toString().replace(/%2C/gi, ',')
  return text ? `?${text}` : ''
}

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    parseSearch,
    stringifySearch,
    defaultPreload: 'intent',
    // O cache dos dados é do TanStack Query; o router não guarda cópia própria.
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    defaultNotFoundComponent: () => <NotFoundPage />,
    defaultErrorComponent: RouteErrorPage,
    defaultPendingComponent: PageSkeleton,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
