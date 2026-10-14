import { useState } from 'react'
import zoomIcon from '@/assets/figma/detail-zoom.svg'
import type { ImageAsset } from '@/api/contracts/common'
import { NftImage } from '@/components/nft-image'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface GalleryProps {
  name: string
  images: ImageAsset[]
}

/** Galeria do Figma: miniaturas de 100 px à esquerda, imagem 404 px (raio 24) em caixa 444 px, botão de zoom. */
export function Gallery({ name, images }: GalleryProps) {
  const [selected, setSelected] = useState(0)
  const current = images[selected] ?? images[0]

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row md:gap-7">
      <ul className="flex gap-3 md:flex-col md:gap-4" aria-label="Imagens do NFT">
        {images.map((image, index) => (
          <li key={`${image.src}-${index}`}>
            <button
              type="button"
              onClick={() => setSelected(index)}
              aria-pressed={index === selected}
              aria-label={`Ver imagem ${index + 1} de ${images.length}`}
              className={cn(
                'block size-16 overflow-hidden rounded-xl border sm:size-[100px]',
                index === selected ? 'border-primary' : 'border-transparent hover:border-border-soft',
              )}
            >
              <NftImage image={image} sizes="100px" alt="" className="size-full object-cover" />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative flex aspect-square w-full items-center justify-center rounded-md bg-surface-card p-4 md:size-[444px] md:shrink-0">
        <NftImage
          image={current}
          priority
          sizes="(min-width: 768px) 404px, 90vw"
          alt={`${name}: ${current.alt}`}
          className="aspect-square w-full rounded-4xl object-cover"
        />
        {/* Gatilho do Radix: ao fechar, o foco volta para este botão. */}
        <Dialog>
          <DialogTrigger asChild>
            <button type="button" className="absolute top-4 right-4 rounded-full" aria-label="Ampliar imagem">
              <img src={zoomIcon} alt="" width={30} height={30} />
            </button>
          </DialogTrigger>
          <DialogContent className="bg-surface-card p-4 sm:max-w-[min(900px,calc(100vw-2rem))]">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <DialogDescription className="sr-only">Imagem ampliada</DialogDescription>
          <NftImage
            image={current}
            sizes="(min-width: 940px) 900px, 100vw"
            alt={`${name}: ${current.alt}`}
            className="max-h-[80dvh] w-full rounded-3xl object-contain"
          />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
