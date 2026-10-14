import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/api/contracts/nfts'
import { NftImage } from '@/components/nft-image'
import { Skeleton } from '@/components/ui/skeleton'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

const CARD_IMAGE_SIZES = '(min-width: 1024px) 250px, (min-width: 640px) 33vw, 50vw'

/**
 * Card de produto do Figma. Desktop: área `surface-card` com a arte (raio 15),
 * nome e preço. Mobile (14:5226): caixa em degradê com raio 20, coração de
 * 28 px e selo "RARO".
 */
export function NftCard({ nft, className }: { nft: NftSummary; className?: string }) {
  return (
    <article className={cn('relative flex flex-col gap-2 md:gap-3', className)}>
      <div className="relative bg-surface-card p-1 max-md:rounded-[20px] max-md:bg-[linear-gradient(139.5deg,var(--surface-card)_12%,var(--surface-raised)_106.6%)] max-md:py-4">
        <NftImage
          image={nft.image}
          sizes={CARD_IMAGE_SIZES}
          alt=""
          className={cn('aspect-square w-full rounded-2xl object-cover', nft.soldOut && 'opacity-60')}
        />
        {nft.rare && !nft.soldOut && (
          <span className="absolute top-4 left-0 flex h-8 w-[68px] items-center pl-2 text-caption-13 font-medium text-ink md:hidden bg-primary">
            RARO
          </span>
        )}
        {nft.soldOut && (
          <span className="absolute top-3 left-3 rounded-md bg-ink/85 px-2 py-1 text-caption-12 font-bold text-foreground">
            Esgotado
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 pr-10 max-md:gap-0.5 max-md:pr-0 max-md:pl-2">
        <h3 className="text-body-15 text-foreground md:text-body-16">
          {/* O link cobre o card inteiro (pseudo-elemento), sem aninhar o botão de favorito. */}
          <Link
            to="/nft/$id"
            params={{ id: nft.id }}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-md focus-visible:after:outline-2 focus-visible:after:outline-ring"
          >
            {nft.name}
          </Link>
        </h3>
        <p className="flex flex-wrap items-baseline gap-x-3 text-body-16 font-bold text-highlight md:text-body-18">
          <span>
            <span className="sr-only">Preço: </span>
            {formatEth(nft.priceEth)}
          </span>
          {nft.previousPriceEth && (
            <s className="text-body-14 font-normal text-subtle md:text-body-16">
              <span className="sr-only">Preço anterior: </span>
              {formatEth(nft.previousPriceEth)}
            </s>
          )}
        </p>
      </div>
      <FavoriteButton nft={nft} variant="icon" className="absolute top-3 right-3 z-10 max-md:right-[11px]" />
    </article>
  )
}

/** Mesmas dimensões do card, para não deslocar o layout quando os dados chegam. */
export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 md:gap-3">
      <div className="bg-surface-card p-1 max-md:rounded-[20px] max-md:py-4">
        <Skeleton className="aspect-square w-full rounded-2xl" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-6 w-1/3" />
    </div>
  )
}
