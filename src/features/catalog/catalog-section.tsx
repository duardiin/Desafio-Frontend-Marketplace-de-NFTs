import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { SlidersHorizontalIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { catalogQueryOptions } from '@/features/catalog/api'
import { CatalogToolbar } from '@/features/catalog/catalog-toolbar'
import { FiltersPanel } from '@/features/catalog/filters-panel'
import { NftCard, NftCardSkeleton } from '@/features/catalog/nft-card'
import { Pagination } from '@/features/catalog/pagination'
import {
  hasActiveFilters,
  selectedCollections,
  selectedNetworks,
  toApiParams,
  withFilter,
  type CatalogSearch,
} from '@/features/catalog/search-params'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

const PAGE_SIZE = 9

interface CatalogSectionProps {
  search: CatalogSearch
  /** Banner "NFT em destaque" abaixo dos filtros (desktop). */
  aside?: ReactNode
}

/** Catálogo da Início: sidebar de filtros + abas, ordenação, grade e paginação. Todo o estado vem da URL. */
export function CatalogSection({ search, aside }: CatalogSectionProps) {
  const params = toApiParams(search)
  const catalog = useQuery(catalogQueryOptions(params))
  const data = catalog.data
  // Com placeholderData, a lista anterior fica visível enquanto a nova carrega.
  const isRefreshing = catalog.isPlaceholderData || (catalog.isFetching && !catalog.isPending)
  const activeFilterCount =
    selectedCollections(search).length + selectedNetworks(search).length + (search.precoMin || search.precoMax ? 1 : 0)

  return (
    <section id="catalogo" aria-labelledby="catalogo-titulo" className="container-page scroll-mt-6">
      <h2 id="catalogo-titulo" className="sr-only">
        Catálogo de NFTs
      </h2>

      <div className="flex flex-col gap-12 lg:flex-row">
        <aside className="hidden w-[310px] shrink-0 flex-col gap-6 lg:flex" aria-label="Filtros">
          <FiltersPanel search={search} facets={data?.facets} />
          {aside}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <CatalogToolbar search={search} />

          <div className="flex flex-wrap items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-primary lg:hidden">
                  <SlidersHorizontalIcon className="size-4" aria-hidden="true" />
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-primary px-1.5 text-caption-12 text-ink">
                      {activeFilterCount}
                      <span className="sr-only"> ativos</span>
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(340px,90vw)] gap-0 overflow-y-auto bg-surface-card">
                <SheetHeader className="px-5 pt-6">
                  <SheetTitle className="text-body-18 font-bold">Filtros</SheetTitle>
                  <SheetDescription>Os resultados são atualizados a cada escolha.</SheetDescription>
                </SheetHeader>
                <FiltersPanel search={search} facets={data?.facets} />
              </SheetContent>
            </Sheet>

            {search.q && (
              <span className="inline-flex items-center gap-2 rounded-md border border-border-soft bg-surface-dark py-1 pr-1 pl-3 text-body-14">
                Busca: “{search.q}”
                <Link
                  to="/"
                  search={withFilter(search, { q: undefined })}
                  resetScroll={false}
                  aria-label={`Remover busca por ${search.q}`}
                  className="grid size-6 place-items-center rounded-sm hover:bg-surface-card"
                >
                  <XIcon className="size-4" aria-hidden="true" />
                </Link>
              </span>
            )}

            <p className="text-body-14 text-muted-foreground" aria-live="polite">
              {data && !catalog.isPlaceholderData && `${data.totalItems} ${data.totalItems === 1 ? 'NFT encontrado' : 'NFTs encontrados'}`}
              {isRefreshing && <span className="ml-2 text-highlight">Atualizando…</span>}
            </p>
          </div>

          {catalog.isPending && <CatalogSkeleton />}

          {catalog.isError && !data && (
            <div role="alert" className="flex flex-col items-start gap-3 bg-surface-card p-6">
              <p className="text-body-16">
                <span className="font-bold text-destructive">Erro: </span>
                Não foi possível carregar o catálogo. {catalog.error.message}
              </p>
              <Button onClick={() => void catalog.refetch()} disabled={catalog.isFetching}>
                {catalog.isFetching ? 'Tentando…' : 'Tentar novamente'}
              </Button>
            </div>
          )}

          {data && data.items.length === 0 && data.totalItems > 0 && (
            <div className="flex flex-col items-start gap-3 bg-surface-card p-6">
              <p className="text-body-16 font-bold">Esta página não existe.</p>
              <p className="text-body-14 text-muted-foreground">
                O catálogo com estes filtros tem {data.totalPages} {data.totalPages === 1 ? 'página' : 'páginas'}.
              </p>
              <Button asChild variant="outline" className="border-primary">
                <Link to="/" search={{ ...search, pagina: undefined }} hash="catalogo">
                  Ir para a página 1
                </Link>
              </Button>
            </div>
          )}

          {data && data.totalItems === 0 && (
            <div className="flex flex-col items-start gap-3 bg-surface-card p-6">
              <p className="text-body-16 font-bold">Nenhum NFT encontrado.</p>
              <p className="text-body-14 text-muted-foreground">
                {hasActiveFilters(search)
                  ? 'Tente remover alguns filtros ou buscar por outro termo.'
                  : 'O catálogo está vazio no momento.'}
              </p>
              {hasActiveFilters(search) && (
                <Button asChild variant="outline" className="border-primary">
                  <Link to="/" search={{ ordem: search.ordem }} resetScroll={false}>
                    Limpar filtros
                  </Link>
                </Button>
              )}
            </div>
          )}

          {data && data.items.length > 0 && (
            <ul
              aria-busy={isRefreshing}
              className={cn(
                'grid grid-cols-2 gap-x-4 gap-y-10 transition-opacity sm:grid-cols-3 sm:gap-x-6 lg:gap-y-[72px]',
                isRefreshing && 'opacity-60',
              )}
            >
              {data.items.map((nft) => (
                <li key={nft.id}>
                  <NftCard nft={nft} />
                </li>
              ))}
            </ul>
          )}

          {data && (
            <div className="mt-4 lg:mt-[56px]">
              <Pagination search={search} page={data.page} totalPages={data.totalPages} />
            </div>
          )}

          {catalog.isError && data && (
            <p role="alert" className="text-body-14">
              <span className="font-bold text-destructive">Erro: </span>
              Não foi possível atualizar o catálogo. Os resultados exibidos podem estar desatualizados.{' '}
              <button type="button" className="font-bold text-highlight underline" onClick={() => void catalog.refetch()}>
                Tentar novamente
              </button>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function CatalogSkeleton() {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Carregando catálogo…
      </span>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:gap-y-[72px]">
        {Array.from({ length: PAGE_SIZE }, (_, index) => (
          <li key={index}>
            <NftCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  )
}
