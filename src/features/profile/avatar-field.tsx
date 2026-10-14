import { useId, useRef, useState } from 'react'
import { toApiError } from '@/api/api-error'
import imageIcon from '@/assets/figma/icon-image.svg'
import { Button } from '@/components/ui/button'
import { notify } from '@/features/feedback/notifications'
import { useRemoveAvatar, useUploadAvatar } from '@/features/profile/api'
import { AVATAR_TYPES, AvatarImageError, prepareAvatar } from '@/features/profile/avatar-image'

/**
 * "Avatar" (Figma): círculo de 50 px, "Alterar" e "Remover". A troca é salva
 * na hora (endpoint próprio), sem esperar o "Salvar" dos dados do perfil.
 */
export function AvatarField({ userId, avatarUrl }: { userId: string; avatarUrl: string | null }) {
  const id = useId()
  const errorId = `${id}-erro`
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [preparing, setPreparing] = useState(false)
  const upload = useUploadAvatar(userId)
  const remove = useRemoveAvatar(userId)
  const busy = preparing || upload.isPending || remove.isPending

  async function onFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setPreparing(true)
    try {
      const dataUrl = await prepareAvatar(file)
      setPreparing(false)
      await upload.mutateAsync({ dataUrl })
      notify('Avatar atualizado.', 'success')
    } catch (cause) {
      setPreparing(false)
      const message =
        cause instanceof AvatarImageError
          ? cause.message
          : (toApiError(cause).fieldErrors.avatar?.[0] ?? toApiError(cause).message)
      setError(message)
    } finally {
      // Permite escolher o mesmo arquivo de novo.
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function onRemove() {
    setError(null)
    try {
      await remove.mutateAsync()
      notify('Avatar removido.', 'success')
    } catch (cause) {
      setError(toApiError(cause).message)
    }
  }

  return (
    <fieldset className="flex flex-col gap-2.5" aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2.5 text-body-15 leading-[15px]">Avatar</legend>
      <div className="flex items-center gap-6">
        <span className="grid size-[50px] shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-surface-raised">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Seu avatar" width={50} height={50} className="size-full object-cover" />
          ) : (
            <img src={imageIcon} alt="" width={24} height={24} className="size-6 p-[1px]" />
          )}
        </span>
        <div className="flex items-center gap-5">
          <input
            ref={inputRef}
            id={`${id}-arquivo`}
            type="file"
            accept={AVATAR_TYPES.join(',')}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
          <Button
            type="button"
            className="h-10 w-[98px] rounded-[3px] text-body-14"
            disabled={busy}
            aria-describedby={error ? errorId : undefined}
            onClick={() => inputRef.current?.click()}
          >
            {preparing || upload.isPending ? 'Enviando…' : 'Alterar'}
            <span className="sr-only"> avatar</span>
          </Button>
          <button
            type="button"
            disabled={busy || !avatarUrl}
            onClick={() => void onRemove()}
            className="rounded-sm text-body-14 leading-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 disabled:hover:no-underline"
          >
            {remove.isPending ? 'Removendo…' : 'Remover'}
            <span className="sr-only"> avatar</span>
          </button>
        </div>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-caption-12 font-medium text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  )
}
