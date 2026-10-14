import { useMutationState } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { HeartIcon } from 'lucide-react'
import heartIcon from '@/assets/figma/icon-heart.svg'
import type { NftSummary } from '@/api/contracts/nfts'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/features/auth/session-query'
import { useReturnHref } from '@/features/auth/use-return-href'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/use-favorites'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  nft: NftSummary
  /** `full`: botão "Favoritar" do detalhe (Figma). `icon`: coração sobre o card. */
  variant: 'full' | 'icon'
  className?: string
}

/** Favoritar exige conta: o visitante vai para o login e volta para a mesma tela. */
export function FavoriteButton({ nft, variant, className }: FavoriteButtonProps) {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const returnHref = useReturnHref()
  const favoriteIds = useFavoriteIds()
  const toggle = useToggleFavorite()
  const isFavorite = favoriteIds.has(nft.id)
  const pending = useMutationState({
    filters: { mutationKey: ['favorites', 'toggle'], status: 'pending' },
    select: (mutation) => (mutation.state.variables as { nft: NftSummary } | undefined)?.nft.id,
  }).includes(nft.id)

  function handleClick() {
    if (!user) {
      void navigate({ to: '/login', search: { redirect: returnHref } })
      return
    }
    // Ignora cliques repetidos enquanto a mudança anterior não termina.
    if (pending) return
    toggle.mutate({ nft, favorited: !isFavorite })
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
        className={cn(
          'grid size-9 place-items-center rounded-full border border-border bg-surface-dark/90 text-highlight transition-colors hover:bg-surface-dark',
          className,
        )}
      >
        <HeartIcon className={cn('size-[18px]', isFavorite && 'fill-current')} aria-hidden="true" />
      </button>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      aria-pressed={isFavorite}
      className={cn(
        'h-10 w-[130px] gap-2 border-primary bg-transparent text-body-14 font-medium text-highlight hover:bg-surface-dark hover:text-highlight',
        isFavorite && 'bg-surface-dark',
        className,
      )}
    >
      {isFavorite ? (
        <HeartIcon className="size-5 fill-current" aria-hidden="true" />
      ) : (
        <img src={heartIcon} alt="" width={20} height={20} className="size-5" />
      )}
      {isFavorite ? 'Favoritado' : 'Favoritar'}
    </Button>
  )
}
