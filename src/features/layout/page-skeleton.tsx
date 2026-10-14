import { Skeleton } from '@/components/ui/skeleton'

/** Placeholder exibido enquanto o código ou os dados de uma rota carregam. */
export function PageSkeleton() {
  return (
    <div className="container-page mt-8" aria-busy="true">
      <span className="sr-only" role="status">
        Carregando…
      </span>
      <Skeleton className="h-[360px] w-full rounded-none" />
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-[300px] w-full" />
        ))}
      </div>
    </div>
  )
}
