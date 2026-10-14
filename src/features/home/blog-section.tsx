import type { ImageAsset } from '@/api/contracts/common'
import { NftImage } from '@/components/nft-image'
import { ComingSoon } from '@/features/layout/coming-soon'

function art(name: string): ImageAsset {
  return {
    src: `/nfts/${name}-512.webp`,
    alt: '',
    width: 1254,
    height: 1254,
    variants: [256, 512, 900].map((width) => ({ width, src: `/nfts/${name}-${width}.webp` })),
  }
}

/**
 * "Diário da Cunhagem": conteúdo editorial estático. Páginas editoriais estão
 * fora da entrega, então "Ler mais" fica marcado como "em breve".
 */
const POSTS = [
  { image: art('gorilla-cream-jacket'), date: '12 de setembro', read: '5 min', title: 'Como funciona a propriedade de NFTs', text: 'Entenda o que você realmente adquire ao comprar um NFT e como a procedência fica registrada.' },
  { image: art('ape-green-jacket'), date: '20 de setembro', read: '4 min', title: '10 artistas digitais para acompanhar', text: 'Criadores que estão moldando a cultura digital e lançamentos para ficar de olho.' },
  { image: art('gorilla-purple-hoodie'), date: '28 de setembro', read: '6 min', title: 'Raridade, atributos e procedência', text: 'Como ler os atributos de um NFT e o que torna uma edição mais rara que outra.' },
  { image: art('ape-headphones'), date: '05 de outubro', read: '3 min', title: 'Como proteger sua carteira', text: 'Boas práticas para guardar suas chaves e evitar golpes comuns no mercado.' },
]

export function BlogSection() {
  return (
    <section aria-labelledby="blog-titulo" className="container-page flex flex-col gap-8">
      <header className="flex flex-col items-center gap-2 text-center">
        <h2 id="blog-titulo" className="text-heading-28 font-bold">
          Diário da Cunhagem
        </h2>
        <p className="text-body-14 text-muted-foreground">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </header>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {POSTS.map((post) => (
          <li key={post.title}>
            <article className="flex h-full flex-col overflow-hidden rounded-xl bg-surface-card">
              <NftImage image={post.image} sizes="(min-width: 1024px) 268px, 50vw" className="h-[195px] w-full object-cover" />
              <div className="flex flex-1 flex-col gap-2 px-4 pt-3 pb-4">
                <p className="text-caption-12 font-medium text-muted-foreground">
                  {post.date} | Leitura de {post.read}
                </p>
                <h3 className="text-body-16 font-bold">{post.title}</h3>
                <p className="flex-1 text-caption-12 font-medium text-muted-foreground">{post.text}</p>
                <ComingSoon className="text-caption-12 font-bold text-highlight">Ler mais →</ComingSoon>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
