import { Link } from '@tanstack/react-router'
import arrowIcon from '@/assets/figma/icon-arrow-right.svg'
import promoMask from '@/assets/figma/promo-mask.svg'
import type { ImageAsset } from '@/api/contracts/common'
import { NftImage } from '@/components/nft-image'
import type { CatalogSearch } from '@/features/catalog/search-params'

function art(name: string, alt: string): ImageAsset {
  return {
    src: `/nfts/${name}-512.webp`,
    alt,
    width: 1254,
    height: 1254,
    variants: [256, 512, 900].map((width) => ({ width, src: `/nfts/${name}-${width}.webp` })),
  }
}

const PROMOS: { title: [string, string]; text: string; image: ImageAsset; search: CatalogSearch }[] = [
  {
    title: ['Lançamentos gênesis', 'de edição limitada'],
    text: 'Coleções gênesis recém-chegadas, com tiragens curtas e acesso antecipado para colecionadores.',
    image: art('ape-green-jacket', ''),
    search: { aba: 'novos' },
  },
  {
    title: ['Arte digital selecionada', 'e muito mais'],
    text: 'Explore peças escolhidas a dedo pela curadoria Kurio, de retratos digitais a obras generativas.',
    image: art('gorilla-cream-jacket', ''),
    search: { colecao: 'arte-digital' },
  },
]

/** Cards promocionais do Figma (586 × 250, raio 8). "Explorar" aplica um filtro real do catálogo. */
export function Promos() {
  return (
    <section aria-label="Promoções" className="container-page grid gap-6 md:grid-cols-2">
      {PROMOS.map((promo) => (
        <article
          key={promo.title[0]}
          className="relative grid min-h-[250px] grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 overflow-hidden rounded-xl bg-surface-card"
        >
          <img src={promoMask} alt="" className="pointer-events-none absolute inset-0 size-full object-cover opacity-60" />
          <NftImage image={promo.image} sizes="290px" alt="" className="relative h-full w-full rounded-3xl object-cover" />
          <div className="relative flex flex-col items-end gap-3 py-6 pr-6 text-right">
            <h3 className="text-body-18 font-bold">
              {promo.title[0]}
              <br />
              {promo.title[1]}
            </h3>
            <p className="text-body-14 leading-6 text-muted-foreground">{promo.text}</p>
            <Link
              to="/"
              search={promo.search}
              hash="catalogo"
              className="inline-flex h-10 w-[140px] items-center justify-center gap-2 rounded-md bg-primary text-body-14 font-medium text-ink hover:bg-primary/80"
            >
              Explorar
              <img src={arrowIcon} alt="" width={11} height={13} className="-rotate-90" />
            </Link>
          </div>
        </article>
      ))}
    </section>
  )
}
