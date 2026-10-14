import { useQuery } from '@tanstack/react-query'
import carouselDots from '@/assets/figma/carousel-dots.svg'
import type { Collection } from '@/api/contracts/nfts'
import { catalogQueryOptions } from '@/features/catalog/api'
import { NftCard, NftCardSkeleton } from '@/features/catalog/nft-card'

const VISIBLE = 5

/** "Mais desta coleção" (Figma): até 5 NFTs da mesma categoria, em linha rolável no mobile. */
export function RelatedNfts({ nftId, collection }: { nftId: string; collection: Collection }) {
  const related = useQuery({
    ...catalogQueryOptions({ collection: [collection], sort: 'populares', tab: 'todos', page: 1 }),
    placeholderData: undefined,
  })
  const items = related.data?.items.filter((item) => item.id !== nftId).slice(0, VISIBLE) ?? []

  if (related.isSuccess && items.length === 0) return null

  return (
    <section aria-labelledby="relacionados-titulo" className="container-page flex flex-col gap-8">
      <h2 id="relacionados-titulo" className="border-b border-primary/50 pb-3 text-body-17 font-bold text-highlight">
        Mais desta coleção
      </h2>
      <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
        {related.isPending
          ? Array.from({ length: VISIBLE }, (_, index) => (
              <li key={index} className="w-[200px] shrink-0 lg:w-auto">
                <NftCardSkeleton />
              </li>
            ))
          : items.map((nft) => (
              <li key={nft.id} className="w-[200px] shrink-0 snap-start lg:w-auto">
                <NftCard nft={nft} />
              </li>
            ))}
      </ul>
      <img src={carouselDots} alt="" width={52} height={12} className="self-center" />
    </section>
  )
}
