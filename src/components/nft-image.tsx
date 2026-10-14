import type { ImgHTMLAttributes } from 'react'
import type { ImageAsset } from '@/api/contracts/common'

interface NftImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'width' | 'height'> {
  image: ImageAsset
  /** Largura exibida, para o navegador escolher a variante (atributo `sizes`). */
  sizes: string
  /** Imagem principal da tela (LCP): carrega já, com prioridade alta. */
  priority?: boolean
}

/** Imagem de NFT responsiva (WebP), com proporção reservada para não deslocar o layout. */
export function NftImage({ image, sizes, priority = false, alt, ...props }: NftImageProps) {
  return (
    <img
      src={image.src}
      srcSet={image.variants.map((variant) => `${variant.src} ${variant.width}w`).join(', ')}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt ?? image.alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      {...props}
    />
  )
}
