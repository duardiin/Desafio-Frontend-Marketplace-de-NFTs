import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/api/contracts/nfts'
import { NftImage } from '@/components/nft-image'
import { Skeleton } from '@/components/ui/skeleton'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

const CARD_IMAGE_SIZES = '(min-width: 1024px) 250px, (min-width: 640px) 33vw, 50vw'

/** Card de produto do Figma: área `surface-card` com a arte (raio 15), nome e preço. */
export function NftCard({ nft, className }: { nft: NftSummary; className?: string }) {
  return (
    <article className={cn('relative flex flex-col gap-3', className)}>
      <div className="relative bg-surface-card p-1">
        <NftImage
          image={nft.image}
          sizes={CARD_IMAGE_SIZES}
          alt=""
          className={cn('aspect-square w-full rounded-2xl object-cover', nft.soldOut && 'opacity-60')}
        />
        {nft.soldOut && (
          <span className="absolute top-3 left-3 rounded-md bg-ink/85 px-2 py-1 text-caption-12 font-bold text-foreground">
            Esgotado
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 pr-10">
        <h3 className="text-body-16 text-foreground">
          {/* O link cobre o card inteiro (pseudo-elemento), sem aninhar o botão de favorito. */}
          <Link
            to="/nft/$id"
            params={{ id: nft.id }}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-md focus-visible:after:outline-2 focus-visible:after:outline-ring"
          >
            {nft.name}
          </Link>
        </h3>
        <p className="flex flex-wrap items-baseline gap-x-3 text-body-18 font-bold text-highlight">
          <span>
            <span className="sr-only">Preço: </span>
            {formatEth(nft.priceEth)}
          </span>
          {nft.previousPriceEth && (
            <s className="text-body-16 font-normal text-subtle">
              <span className="sr-only">Preço anterior: </span>
              {formatEth(nft.previousPriceEth)}
            </s>
          )}
        </p>
      </div>
      <FavoriteButton nft={nft} variant="icon" className="absolute top-3 right-3 z-10" />
    </article>
  )
}

/** Mesmas dimensões do card, para não deslocar o layout quando os dados chegam. */
export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-surface-card p-1">
        <Skeleton className="aspect-square w-full rounded-2xl" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-6 w-1/3" />
    </div>
  )
}
