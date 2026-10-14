import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ComingSoonProps {
  children: ReactNode
  className?: string
}

/**
 * Item de navegação fora do escopo da entrega. Mantém o visual do Figma, mas
 * não é clicável nem focável e anuncia "(em breve)" para leitores de tela,
 * para não aparentar sucesso funcional.
 */
export function ComingSoon({ children, className }: ComingSoonProps) {
  return (
    <span aria-disabled="true" title="Em breve" className={cn('cursor-not-allowed', className)}>
      {children}
      <span className="sr-only"> (em breve)</span>
    </span>
  )
}
