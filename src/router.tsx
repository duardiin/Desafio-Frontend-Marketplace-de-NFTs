import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { NotFoundPage } from '@/features/layout/not-found-page'
import { PageSkeleton } from '@/features/layout/page-skeleton'
import { RouteErrorPage } from '@/features/layout/route-error-page'
import { routeTree } from '@/routeTree.gen'

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
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
