import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

/** Marca KURIO (texto, sem logo em imagem no Figma). */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Kurio, página inicial"
      className={cn('text-body-14 font-bold tracking-brand text-foreground', className)}
    >
      KURIO
    </Link>
  )
}
