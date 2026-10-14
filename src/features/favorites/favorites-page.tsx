import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { AccountLayout } from '@/features/account/account-layout'
import { useCurrentUser } from '@/features/auth/session-query'
import { NftCard, NftCardSkeleton } from '@/features/catalog/nft-card'
import { favoritesQueryOptions } from '@/features/favorites/api'

/** Favoritos do usuário (persistem na API). Estado não desenhado: segue o grid do catálogo. */
export function FavoritesPage() {
  const user = useCurrentUser()
  if (!user) return null
  return (
    <AccountLayout active="favoritos">
      <FavoritesContent userId={user.id} />
    </AccountLayout>
  )
}

function FavoritesContent({ userId }: { userId: string }) {
  const favorites = useQuery(favoritesQueryOptions(userId))

  return (
    <section className="flex flex-col gap-8" aria-labelledby="favoritos-titulo">
      <h1 id="favoritos-titulo" className="text-body-16 leading-4 font-bold">
        Meus favoritos
      </h1>

      {favorites.isPending && (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      )}

      {favorites.isError && (
        <div role="alert" className="flex flex-col items-start gap-3 bg-surface-card p-6">
          <p className="text-body-16">
            <span className="font-bold text-destructive">Erro: </span>
            {favorites.error.message}
          </p>
          <Button onClick={() => void favorites.refetch()}>Tentar novamente</Button>
        </div>
      )}

      {favorites.isSuccess && favorites.data.items.length === 0 && (
        <div className="flex flex-col items-start gap-3 bg-surface-card p-6">
          <p className="text-body-16 font-bold">Você ainda não favoritou nenhum NFT.</p>
          <Button asChild>
            <Link to="/" hash="catalogo">
              Explorar o catálogo
            </Link>
          </Button>
        </div>
      )}

      {/* Os cards usam h3: o h2 (oculto) mantém a hierarquia de títulos. */}
      <h2 className="sr-only">NFTs favoritados</h2>
      {favorites.isSuccess && favorites.data.items.length > 0 && (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3">
          {favorites.data.items.map((nft) => (
            <li key={nft.id}>
              <NftCard nft={nft} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
