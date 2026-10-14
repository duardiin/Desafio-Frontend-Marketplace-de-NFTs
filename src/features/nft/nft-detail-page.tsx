import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { NftDetail } from '@/api/contracts/nfts'
import { COLLECTION_LABELS } from '@/api/contracts/nfts'
import { NETWORK_LABELS } from '@/api/contracts/common'
import { Skeleton } from '@/components/ui/skeleton'
import { nftDetailQueryOptions } from '@/features/catalog/api'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { BuyButton } from '@/features/cart/buy-button'
import { availabilityText, initialEdition, maxForEdition } from '@/features/nft/editions'
import { Gallery } from '@/features/nft/gallery'
import { NftInfoTabs } from '@/features/nft/nft-info-tabs'
import { EditionPicker, QuantityStepper } from '@/features/nft/purchase-options'
import { Rating } from '@/features/nft/rating'
import { RelatedNfts } from '@/features/nft/related-nfts'
import { ShareLinks } from '@/features/nft/share-links'
import { formatEth } from '@/lib/eth'

interface NftDetailPageProps {
  id: string
  editionId: string | undefined
}

/** Detalhes do NFT (Figma 10:244). Os dados já foram carregados pelo loader da rota. */
export function NftDetailPage({ id, editionId }: NftDetailPageProps) {
  const { data: nft } = useSuspenseQuery(nftDetailQueryOptions(id))
  return (
    <div className="flex flex-col gap-16 lg:gap-24">
      {/* `key`: troca de NFT reinicia edição e quantidade. */}
      <ProductSection key={nft.id} nft={nft} editionId={editionId} />
      <section aria-label="Informações do NFT" className="container-page">
        <NftInfoTabs nft={nft} />
      </section>
      <RelatedNfts nftId={nft.id} collection={nft.collection} />
    </div>
  )
}

function ProductSection({ nft, editionId }: { nft: NftDetail; editionId: string | undefined }) {
  const navigate = useNavigate()
  const edition = initialEdition(nft.editions, editionId)
  const max = maxForEdition(edition, nft.maxPerOrder)
  const [quantity, setQuantity] = useState(1)
  const safeQuantity = Math.min(Math.max(1, quantity), Math.max(1, max))

  function selectEdition(id: string) {
    setQuantity(1)
    void navigate({ to: '/nft/$id', params: { id: nft.id }, search: { edicao: id }, replace: true, resetScroll: false })
  }

  return (
    <section className="container-page mt-6 flex flex-col gap-3" aria-labelledby="nft-titulo">
      <nav aria-label="Trilha de navegação" className="text-body-15 font-bold">
        <ol className="flex gap-1">
          <li>
            <Link to="/" className="hover:text-highlight">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/" hash="catalogo" className="hover:text-highlight">
              Mercado
            </Link>
          </li>
        </ol>
      </nav>

      <div className="flex flex-col gap-8 lg:flex-row">
        <Gallery name={nft.name} images={nft.gallery} />

        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:justify-between lg:gap-4">
          <div className="flex flex-col gap-3">
            <h1 id="nft-titulo" className="text-heading-28 font-bold">
              {nft.name}
            </h1>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-baseline gap-3 text-heading-22 font-bold text-highlight">
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
              <Rating average={nft.rating.average} count={nft.rating.count} />
            </div>
            <div aria-hidden="true" className="mt-1 h-px bg-primary/50" />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-body-15 font-bold">Sobre este NFT:</h2>
            <p className="text-body-14 leading-6 text-muted-foreground">{nft.description}</p>
          </div>

          <div className="flex flex-col gap-2">
            <EditionPicker editions={nft.editions} selectedId={edition?.id} onSelect={selectEdition} />
            <p className="text-caption-12 text-muted-foreground" aria-live="polite">
              {nft.soldOut
                ? 'Todas as edições estão esgotadas.'
                : edition && `${availabilityText(edition)} · máximo de ${nft.maxPerOrder} por pedido`}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <QuantityStepper value={safeQuantity} max={max} onChange={setQuantity} />
            <div className="flex gap-2">
              <BuyButton
                nftId={nft.id}
                nftName={nft.name}
                editionId={edition?.id}
                editionLabel={edition?.label}
                quantity={safeQuantity}
                disabled={max === 0}
              />
              <FavoriteButton nft={nft} variant="full" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <dl className="flex flex-col gap-3 text-body-15 text-subtle">
              <div className="flex gap-1">
                <dt>ID do token:</dt>
                <dd>{nft.tokenId}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Coleção:</dt>
                <dd>
                  {nft.series} ({COLLECTION_LABELS[nft.collection]})
                </dd>
              </div>
              <div className="flex gap-1">
                <dt>Atributos:</dt>
                <dd>{nft.attributes.join(', ')}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Criador:</dt>
                <dd>
                  {nft.creator.name} · Rede {NETWORK_LABELS[nft.network]}
                </dd>
              </div>
            </dl>
            <ShareLinks name={nft.name} />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Mesmo esqueleto da tela, para o carregamento lento não deslocar o layout. */
export function NftDetailSkeleton() {
  return (
    <div className="container-page mt-6 flex flex-col gap-3" aria-busy="true">
      <span role="status" className="sr-only">
        Carregando NFT…
      </span>
      <Skeleton className="h-4 w-[160px]" />
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex flex-col-reverse gap-4 md:flex-row md:gap-7">
          <div className="flex gap-3 md:flex-col md:gap-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="size-16 rounded-xl sm:size-[100px]" />
            ))}
          </div>
          <Skeleton className="aspect-square w-full rounded-md md:size-[444px]" />
        </div>
        <div className="flex flex-1 flex-col gap-4">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-14 w-1/2" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-2/3" />
        </div>
      </div>
    </div>
  )
}
