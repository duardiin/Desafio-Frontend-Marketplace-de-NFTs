import { cn } from '@/lib/utils'

/** Erro geral do formulário (vindo da API). Anunciado imediatamente por leitores de tela. */
export function FormAlert({ message, className }: { message: string | undefined; className?: string }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className={cn('rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-body-14', className)}
    >
      <span className="font-bold text-destructive">Erro: </span>
      {message}
    </p>
  )
}
