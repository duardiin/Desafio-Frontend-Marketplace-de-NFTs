import { XIcon } from 'lucide-react'
import { dismiss, useNotifications } from '@/features/feedback/notifications'
import { cn } from '@/lib/utils'

/**
 * Região de avisos (estado não desenhado no Figma; segue cores e raios do tema).
 * A região existe sempre no DOM para que leitores de tela anunciem as mensagens.
 * Erros usam ícone/texto, não só cor.
 */
export function NotificationRegion() {
  const notifications = useNotifications()

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 max-md:bottom-[134px] z-60 flex flex-col items-end gap-2 sm:left-auto sm:w-[380px]"
    >
      {notifications.map((item) => (
        <div
          key={item.id}
          data-tone={item.tone}
          className={cn(
            'pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-surface-card px-4 py-3 text-body-14 shadow-lg',
            item.tone === 'error' && 'border-destructive',
            item.tone === 'success' && 'border-primary',
            item.tone === 'info' && 'border-border-soft',
          )}
        >
          <p className="flex-1">
            {item.tone === 'error' && <span className="font-bold text-destructive">Erro: </span>}
            {item.message}
          </p>
          <button
            type="button"
            onClick={() => dismiss(item.id)}
            className="-m-1 rounded-sm p-1 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-4" aria-hidden="true" />
            <span className="sr-only">Fechar aviso</span>
          </button>
        </div>
      ))}
    </div>
  )
}
