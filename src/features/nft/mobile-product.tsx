import { useRef, useState } from 'react'
import type { NftDetail } from '@/api/contracts/nfts'
import { COLLECTION_LABELS } from '@/api/contracts/nfts'
import { NETWORK_LABELS } from '@/api/contracts/common'
import starFilled from '@/assets/figma/icon-star-filled.svg'
import { NftImage } from '@/components/nft-image'
import { BuyButton } from '@/features/cart/buy-button'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { BackButton, MobileActionBar } from '@/features/layout/mobile-screen'
import { availabilityText } from '@/features/nft/editions'
import { EditionPicker, QuantityStepper } from '@/features/nft/purchase-options'
import { ShareLinks } from '@/features/nft/share-links'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

interface MobileProductProps {
  nft: NftDetail
  edition: NftDetail['editions'][number] | undefined
  /** Máximo para a edição escolhida (0 = esgotada). */
  max: number
  quantity: number
  onQuantityChange: (value: number) => void
  onEditionChange: (id: string) => void
}

/**
 * Detalhe mobile do Figma (15:5536): voltar e favorito no topo, imagem grande,
 * cartão de informações subindo sobre a imagem e barra fixa com quantidade,
 * preço, "Comprar NFT" e o botão de carrinho.
 */
export function MobileProduct({ nft, edition, max, quantity, onQuantityChange, onEditionChange }: MobileProductProps) {
  return (
    <section aria-labelledby="nft-titulo" className="flex flex-col">
      <div className="container-page flex items-center justify-between pt-6 pb-2.5">
        <BackButton fallback="/" />
        <FavoriteButton nft={nft} variant="icon" className="max-md:size-8" />
      </div>

      <div className="container-page">
        <MobileGallery name={nft.name} images={nft.gallery} />
      </div>

      <div className="relative -mt-8 rounded-t-[32px] bg-surface-card px-6 pt-6 pb-8">
        <div className="flex items-start justify-between gap-3">
          <h1 id="nft-titulo" className="text-[20px] leading-7 font-bold">
            {nft.name}
          </h1>
          <RatingPill average={nft.rating.average} count={nft.rating.count} />
        </div>
        <p className="mt-3 text-body-14 leading-6 text-muted-foreground">{nft.description}</p>

        <div className="mt-3">
          <EditionPicker editions={nft.editions} selectedId={edition?.id} onSelect={onEditionChange} size="compact" />
          <p className="mt-2 text-caption-12 text-muted-foreground" aria-live="polite">
            {nft.soldOut
              ? 'Todas as edições estão esgotadas.'
              : edition && `${availabilityText(edition)} · máximo de ${nft.maxPerOrder} por pedido`}
          </p>
        </div>

        <dl className="mt-4 flex flex-col gap-3 text-body-15 text-subtle">
          <div className="flex gap-1">
            <dt>ID do token:</dt>
            <dd>{nft.tokenId}</dd>
          </div>
          <div className="flex gap-1">
            <dt>Coleção:</dt>
            <dd>{nft.series}</dd>
          </div>
          <div className="flex gap-1">
            <dt>Atributos:</dt>
            <dd>{nft.attributes.join(', ')}</dd>
          </div>
          <div className="flex gap-1">
            <dt>Criador:</dt>
            <dd>
              {nft.creator.name} · {COLLECTION_LABELS[nft.collection]} · Rede {NETWORK_LABELS[nft.network]}
            </dd>
          </div>
        </dl>
        <div className="mt-4">
          <ShareLinks name={nft.name} />
        </div>
      </div>

      <MobileActionBar>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="text-body-15 font-bold">
              Qtd.
            </span>
            <QuantityStepper value={quantity} max={max} onChange={onQuantityChange} size="compact" />
          </div>
          <p className="text-[20px] leading-7 font-bold text-highlight">
            <span className="sr-only">Preço: </span>
            {formatEth(nft.priceEth)}
          </p>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <BuyButton
            variant="mobile"
            nftId={nft.id}
            nftName={nft.name}
            editionId={edition?.id}
            editionLabel={edition?.label}
            quantity={quantity}
            disabled={max === 0}
          />
          <BuyButton
            variant="mobile-cart"
            nftId={nft.id}
            nftName={nft.name}
            editionId={edition?.id}
            editionLabel={edition?.label}
            quantity={quantity}
            disabled={max === 0}
          />
        </div>
      </MobileActionBar>
    </section>
  )
}

/** "★ 4.8 (19)" em pílula com borda `primary` (Figma mobile). */
function RatingPill({ average, count }: { average: number; count: number }) {
  return (
    <div
      role="img"
      className="flex h-7 shrink-0 items-center gap-1 rounded-full border border-primary px-2 text-body-14"
      aria-label={`Avaliação média ${average.toLocaleString('pt-BR')} de 5, ${count} avaliações`}
    >
      <img src={starFilled} alt="" width={14} height={14} />
      <span aria-hidden="true" className="font-bold">
        {average.toFixed(1)}
      </span>
      <span aria-hidden="true" className="text-muted-foreground">
        ({count})
      </span>
    </div>
  )
}

/**
 * Galeria mobile: o frame mostra uma imagem grande; as vistas extras deslizam
 * na horizontal (scroll-snap), com pontos para ir direto a cada uma.
 */
function MobileGallery({ name, images }: { name: string; images: NftDetail['gallery'] }) {
  const listRef = useRef<HTMLUListElement>(null)
  const [current, setCurrent] = useState(0)

  function onScroll() {
    const list = listRef.current
    if (list) setCurrent(Math.round(list.scrollLeft / list.clientWidth))
  }

  function goTo(index: number) {
    const list = listRef.current
    list?.scrollTo({ left: index * list.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <ul
        ref={listRef}
        onScroll={onScroll}
        aria-label="Imagens do NFT"
        // Focável: com o foco, as setas do teclado deslizam as imagens.
        tabIndex={0}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-3xl outline-none [scrollbar-width:none] focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, index) => (
          <li key={`${image.src}-${index}`} className="w-full shrink-0 snap-center">
            <NftImage
              image={image}
              priority={index === 0}
              sizes="100vw"
              alt={`${name}: ${image.alt}`}
              className="aspect-[360/340] w-full object-cover"
            />
          </li>
        ))}
      </ul>
      {images.length > 1 && (
        <div className="absolute inset-x-0 bottom-9 flex justify-center">
          {images.map((image, index) => (
            // Área de toque de 24 px; o ponto visível é menor.
            <button
              key={`${image.src}-${index}-ponto`}
              type="button"
              aria-label={`Ver imagem ${index + 1} de ${images.length}`}
              aria-pressed={index === current}
              onClick={() => goTo(index)}
              className="grid h-6 min-w-6 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                aria-hidden="true"
                className={cn('h-2 rounded-full transition-all', index === current ? 'w-5 bg-primary' : 'w-2 bg-foreground/60')}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
