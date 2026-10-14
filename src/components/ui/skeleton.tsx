import { cn } from "@/lib/utils"

/**
 * Bloco de carregamento com shimmer.
 *
 * - Sempre passe as dimensões finais do conteúdo (ex.: `h-[300px] w-full`,
 *   `aspect-square`) para não deslocar o layout quando os dados chegarem.
 * - É decorativo (`aria-hidden`): anuncie o carregamento no contêiner, com
 *   `aria-busy` e um texto para leitores de tela.
 * - Com `prefers-reduced-motion: reduce`, o brilho para e fica um bloco estático.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-md bg-surface-dark bg-[linear-gradient(90deg,var(--surface-dark)_25%,var(--border-soft)_50%,var(--surface-dark)_75%)] bg-size-[200%_100%] motion-reduce:animate-none motion-reduce:bg-none",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
