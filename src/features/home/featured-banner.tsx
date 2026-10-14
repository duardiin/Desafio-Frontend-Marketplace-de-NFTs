import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { NftImage } from '@/components/nft-image'
import { Skeleton } from '@/components/ui/skeleton'
import { catalogQueryOptions } from '@/features/catalog/api'
import { formatEth } from '@/lib/eth'

/** Destaque vindo da API: o NFT mais popular do catálogo. */
const FEATURED_PARAMS = { sort: 'populares', tab: 'todos', page: 1 } as const

/** Banner "NFT em destaque" do Figma (310 × 470, gradiente cobre, imagem com raio 22). */
export function FeaturedBanner() {
  const featured = useQuery({ ...catalogQueryOptions(FEATURED_PARAMS), placeholderData: undefined })
  const nft = featured.data?.items[0]

  return (
    <section
      aria-labelledby="destaque-titulo"
      className="flex flex-col items-center gap-3 overflow-hidden bg-[linear-gradient(to_bottom,rgba(210,138,76,0.10),rgba(210,138,76,0.03))] pt-6"
    >
      <h2 id="destaque-titulo" className="self-start px-5 text-heading-24 font-bold text-highlight">
        NFT EM DESTAQUE
      </h2>
      <p className="text-heading-22 font-bold">OFERTA LIMITADA</p>
      {nft ? (
        <Link to="/nft/$id" params={{ id: nft.id }} className="group relative block w-full">
          <NftImage
            image={nft.image}
            sizes="310px"
            alt={`${nft.name}: ${nft.image.alt}`}
            className="aspect-[310/368] w-full rounded-banner object-cover"
          />
          <span className="absolute inset-x-3 bottom-3 rounded-md bg-ink/80 px-3 py-2 text-body-14">
            <span className="block font-bold group-hover:text-highlight">{nft.name}</span>
            <span className="text-highlight">{formatEth(nft.priceEth)}</span>
          </span>
        </Link>
      ) : (
        <Skeleton className="aspect-[310/368] w-full rounded-banner" />
      )}
    </section>
  )
}
