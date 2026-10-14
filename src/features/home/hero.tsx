import heroDots from '@/assets/figma/hero-dots.svg'
import type { ImageAsset } from '@/api/contracts/common'
import { NftImage } from '@/components/nft-image'
import { Button } from '@/components/ui/button'

/** Arte estática do hero (asset do Figma, não é dado de catálogo). */
const HERO_IMAGE: ImageAsset = {
  src: '/nfts/ape-green-jacket-512.webp',
  alt: 'Macaco de óculos redondos e jaqueta verde, arte em destaque da Kurio',
  width: 1254,
  height: 1254,
  variants: [256, 512, 900].map((width) => ({ width, src: `/nfts/ape-green-jacket-${width}.webp` })),
}

/** Hero do Figma (1200 × 450, `surface-card`): texto à esquerda, arte 450 × 450 (raio 24) à direita. */
export function Hero() {
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
