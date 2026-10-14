import heroDots from '@/assets/figma/hero-dots.svg'
import arrowRight from '@/assets/figma/m-arrow-right.svg'
import mobileDots from '@/assets/figma/m-hero-dots.svg'
import mobileHeroBackground from '@/assets/figma/m-hero-mask.svg'
import type { ImageAsset } from '@/api/contracts/common'
import { NftImage } from '@/components/nft-image'
import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/lib/use-media-query'

/** Arte estática do hero (asset do Figma, não é dado de catálogo). */
const HERO_IMAGE: ImageAsset = {
  src: '/nfts/ape-green-jacket-512.webp',
  alt: 'Macaco de óculos redondos e jaqueta verde, arte em destaque da Kurio',
  width: 1254,
  height: 1254,
  variants: [256, 512, 900].map((width) => ({ width, src: `/nfts/ape-green-jacket-${width}.webp` })),
}

const SECOND_IMAGE: ImageAsset = {
  src: '/nfts/gorilla-purple-hoodie-256.webp',
  alt: '',
  width: 1254,
  height: 1254,
  variants: [256, 512].map((width) => ({ width, src: `/nfts/gorilla-purple-hoodie-${width}.webp` })),
}

/**
 * Duas versões do Figma: desktop (2:2) e mobile (14:5226). Uma só é montada
 * por vez, para o navegador baixar apenas a imagem principal (LCP) da versão
 * visível.
 */
export function Hero() {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  return isDesktop ? <DesktopHero /> : <MobileHero />
}

/** Hero desktop (1200 × 450, `surface-card`): texto à esquerda, arte 450 × 450 (raio 24) à direita. */
function DesktopHero() {
  return (
    <section aria-labelledby="hero-titulo" className="container-page mt-8">
      <div className="flex flex-col-reverse gap-8 bg-surface-card p-6 md:flex-row md:items-center md:justify-between md:gap-6 md:p-0 md:pl-10">
        <div className="flex max-w-[600px] flex-col gap-4 md:py-10">
          <p className="text-body-14 font-medium tracking-brand text-foreground">Bem-vindo à Kurio</p>
          <h1 id="hero-titulo" className="text-heading-28 font-bold uppercase md:text-[34px] md:leading-[52px] xl:text-display">
            Seja dono do futuro
            <br /> da arte digital
          </h1>
          <p className="max-w-[557px] text-body-14 leading-6 text-muted-foreground">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie
            artistas e faça parte da cultura da internet.
          </p>
          <div className="mt-2 flex items-center justify-between gap-6">
            <Button asChild className="h-10 w-[140px]">
              <a href="#catalogo">EXPLORAR</a>
            </Button>
            <img src={heroDots} alt="" width={40} height={8} className="hidden md:block" />
          </div>
        </div>
        <NftImage
          image={HERO_IMAGE}
          priority
          sizes="(min-width: 768px) 450px, 100vw"
          className="aspect-square w-full rounded-4xl object-cover md:w-[min(450px,45vw)] md:shrink-0"
        />
      </div>
    </section>
  )
}

/**
 * Hero mobile (366 × 190, raio 12): fundo com círculos em degradê, texto à
 * esquerda e duas artes sobrepostas (138 e 58 px) à direita.
 */
function MobileHero() {
  return (
    <section aria-labelledby="hero-titulo" className="container-page">
      <div className="relative flex h-[190px] flex-col items-center justify-center gap-4 overflow-hidden rounded-xl p-4">
        <img src={mobileHeroBackground} alt="" width={366} height={190} className="absolute inset-0 size-full" />
        <div className="relative flex w-full items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-caption-12 leading-4 font-medium">Bem-vindo à Kurio</p>
            <h1 id="hero-titulo" className="mt-1.5 max-w-[190px] text-body-18 leading-[29px] font-bold uppercase">
              Seja dono da cultura digital
            </h1>
            <p className="mt-1.5 text-caption-12 leading-[18px] text-muted-foreground">
              Descubra NFTs selecionados de criadores do mundo todo.
            </p>
            <a
              href="#catalogo"
              className="flex w-fit items-center gap-2 rounded-sm text-caption-12 leading-[14px] font-bold text-highlight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              EXPLORAR
              <img src={arrowRight} alt="" width={10} height={12} className="-rotate-90" />
            </a>
          </div>
          <div className="relative size-[138px] shrink-0">
            <NftImage image={HERO_IMAGE} priority sizes="138px" className="size-[138px] rounded-2xl object-cover" />
            <NftImage
              image={SECOND_IMAGE}
              sizes="58px"
              className="absolute top-[88px] left-[14px] size-[58px] rounded-2xl object-cover"
            />
          </div>
        </div>
        <img src={mobileDots} alt="" width={33} height={7} className="relative" />
      </div>
    </section>
  )
}
