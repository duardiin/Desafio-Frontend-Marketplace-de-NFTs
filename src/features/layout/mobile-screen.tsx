import { useCanGoBack, useRouter } from '@tanstack/react-router'
import { ChevronLeftIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Botão de voltar dos frames mobile (círculo de 32 px `surface-raised`, seta `primary`). */
export function BackButton({ fallback, className }: { fallback: '/' | '/carrinho'; className?: string }) {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={() => (canGoBack ? router.history.back() : void router.navigate({ to: fallback }))}
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-full border border-border bg-surface-raised text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
    >
      <ChevronLeftIcon className="size-4" strokeWidth={1.75} aria-hidden="true" />
    </button>
  )
}

/**
 * Topo das telas mobile do Figma (Carrinho e Pagamento): voltar à esquerda e
 * título centralizado (20 Bold). Substitui o header do site abaixo de 768 px.
 */
export function MobileTopBar({ title, fallback, titleId }: { title: string; fallback: '/' | '/carrinho'; titleId?: string }) {
  return (
    <div className="container-page pt-6 pb-6 md:hidden">
      <div className="relative flex h-8 items-center justify-center">
        <BackButton fallback={fallback} className="absolute top-0 left-0" />
        <h1 id={titleId} className="text-[20px] leading-8 font-bold">
          {title}
        </h1>
      </div>
    </div>
  )
}

/**
 * Barra de ação fixa embaixo (Figma: cartão com cantos superiores de 32 px).
 * O conteúdo da página precisa reservar a altura dela (`pb-…` no mobile).
 */
export function MobileActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-fixed-bar
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 rounded-t-[32px] bg-surface-card px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(10,6,4,0.45)] md:hidden',
        className,
      )}
    >
      {children}
    </div>
  )
}
