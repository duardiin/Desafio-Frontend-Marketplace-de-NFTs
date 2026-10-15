import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { AuthDialogHost } from '@/features/auth/auth-dialog'
import { NotificationRegion } from '@/features/feedback/notification-region'
import { NotFoundPage } from '@/features/layout/not-found-page'
import { RealtimeProvider } from '@/features/realtime/realtime-provider'
import { MobileTabBar } from '@/features/layout/mobile-tab-bar'
import { SiteFooter } from '@/features/layout/site-footer'
import { SiteHeader } from '@/features/layout/site-header'
import { useRouteChrome } from '@/features/layout/use-route-chrome'
import { cn } from '@/lib/utils'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <NotFoundPage />,
})

function RootLayout() {
  const { mobileTabBar } = useRouteChrome()
  // Abaixo de 768 px, a tab bar fixa (126 px) não pode cobrir o fim da página.
  // Telas com barra de ação própria (Detalhe, Carrinho, Pagamento) reservam o espaço delas.
  return (
    <div className={cn('flex min-h-dvh flex-col overflow-x-clip', mobileTabBar && 'max-md:pb-[126px]')}>
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-body-16 font-bold text-ink focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <SiteFooter />
      {mobileTabBar && <MobileTabBar />}
      <NotificationRegion />
      <AuthDialogHost />
      <RealtimeProvider />
    </div>
  )
}
