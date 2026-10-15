import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CartLine } from '@/features/cart/cart-line'
import { CartSummary } from '@/features/cart/cart-summary'
import { cartItemCount, useCart, useQuote } from '@/features/cart/use-cart'
import { MobileCartLine, MobileCartSheet } from '@/features/cart/mobile-cart'
import { MobileTopBar } from '@/features/layout/mobile-screen'
import { RelatedNfts } from '@/features/nft/related-nfts'
import { useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'

/**
 * Carrinho de NFTs. Desktop: o frame 11:1278 não foi extraído e segue o padrão
 * do detalhe. Mobile: frame 16:360 (a partir de print).
 */
export function CartPage() {
  const cart = useCart()
  const items = cart.data?.items ?? []
  const quote = useQuote({ enabled: items.length > 0 })
  const count = cartItemCount(cart.data)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // Mobile (Figma 16:360): topo com voltar, itens em cartões e resumo fixo embaixo.
  if (!isDesktop) {
    return (
      <div className={cn('flex flex-col gap-12', items.length > 0 && 'pb-[400px]')}>
        <section className="flex flex-col" aria-labelledby="carrinho-titulo">
          <MobileTopBar title="Carrinho de NFTs" fallback="/" titleId="carrinho-titulo" />
          <div className="container-page flex flex-col gap-4">
            {count > 0 && (
              <p className="sr-only">
                {count} {count === 1 ? 'item' : 'itens'}
              </p>
            )}
            {cart.isPending && <CartSkeleton />}
            {cart.isError && <CartError message={cart.error.message} onRetry={() => void cart.refetch()} />}
            {cart.isSuccess && items.length === 0 && <EmptyCart />}
            {cart.isSuccess && items.length > 0 && (
              <ul aria-label="Itens do carrinho" className="flex flex-col gap-5">
                {items.map((item) => (
                  <MobileCartLine
                    key={item.lineId}
                    item={item}
                    quoteLine={quote.data?.lines.find((line) => line.lineId === item.lineId)}
                    blocker={quote.data?.blockers.find((blocker) => blocker.lineId === item.lineId)}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
        {items[0] && <RelatedNfts nftId={items[0].nft.id} collection={items[0].nft.collection} />}
        {cart.isSuccess && items.length > 0 && (
          <MobileCartSheet
            quote={quote.data}
            isLoading={quote.isPending}
            isRefreshing={quote.isFetching && !quote.isPending}
            isError={quote.isError}
            onRetry={() => void quote.refetch()}
            couponCode={cart.data.couponCode}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-16 lg:gap-24">
      <section className="container-page mt-6 flex flex-col gap-6" aria-labelledby="carrinho-titulo">
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

        <h1 id="carrinho-titulo" className="text-heading-28 font-bold">
          Carrinho de NFTs
          {count > 0 && (
            <span className="ml-3 text-body-16 font-normal text-muted-foreground">
              {count} {count === 1 ? 'item' : 'itens'}
            </span>
          )}
        </h1>

        {cart.isPending && <CartSkeleton />}

        {cart.isError && <CartError message={cart.error.message} onRetry={() => void cart.refetch()} />}

        {cart.isSuccess && items.length === 0 && <EmptyCart />}

        {cart.isSuccess && items.length > 0 && (
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <ul aria-label="Itens do carrinho" className="flex flex-col">
              {items.map((item) => (
                <CartLine
                  key={item.lineId}
                  item={item}
                  quoteLine={quote.data?.lines.find((line) => line.lineId === item.lineId)}
                  blocker={quote.data?.blockers.find((blocker) => blocker.lineId === item.lineId)}
                />
              ))}
            </ul>
            <CartSummary
              quote={quote.data}
              isLoading={quote.isPending}
              isRefreshing={quote.isFetching && !quote.isPending}
              isError={quote.isError}
              onRetry={() => void quote.refetch()}
              couponCode={cart.data.couponCode}
            />
          </div>
        )}
      </section>

      {items[0] && <RelatedNfts nftId={items[0].nft.id} collection={items[0].nft.collection} />}
    </div>
  )
}

function CartError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl bg-surface-card p-6 md:rounded-none">
      <p className="text-body-16">
        <span className="font-bold text-destructive">Erro: </span>
        Não foi possível carregar o carrinho. {message}
      </p>
      <Button onClick={onRetry}>Tentar novamente</Button>
    </div>
  )
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl bg-surface-card p-6 md:rounded-none">
      <p className="text-body-16 font-bold">Seu carrinho está vazio.</p>
      <p className="text-body-14 text-muted-foreground">Explore o catálogo e escolha a edição que quer colecionar.</p>
      <Button asChild>
        <Link to="/" hash="catalogo">
          Explorar o catálogo
        </Link>
      </Button>
    </div>
  )
}

/** Mesmas dimensões das linhas e do resumo, para não deslocar o layout. */
function CartSkeleton() {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]" aria-busy="true">
      <span role="status" className="sr-only">
        Carregando carrinho…
      </span>
      <div className="flex flex-col gap-5">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="flex gap-4">
            <Skeleton className="size-20 shrink-0 rounded-xl sm:size-[120px]" />
            <div className="flex flex-1 flex-col gap-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-[33px] w-[120px]" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-[360px] w-full rounded-xl" />
    </div>
  )
}
