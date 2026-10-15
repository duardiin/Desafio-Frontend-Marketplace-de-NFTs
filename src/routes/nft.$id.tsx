import { createFileRoute, notFound } from '@tanstack/react-router'
import { ApiError } from '@/api/api-error'
import { nftDetailQueryOptions } from '@/features/catalog/api'
import { NotFoundPage } from '@/features/layout/not-found-page'
import { NftDetailPage, NftDetailSkeleton } from '@/features/nft/nft-detail-page'

export const Route = createFileRoute('/nft/$id')({
  staticData: { navSection: 'mercado', headerDivider: false, mobileHeader: false, mobileTabBar: false },
  validateSearch: (search: Record<string, unknown>): { edicao?: string } => ({
    edicao: typeof search.edicao === 'string' ? search.edicao : undefined,
  }),
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(nftDetailQueryOptions(params.id))
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'not-found') throw notFound()
      throw error
    }
  },
  // Mostra o skeleton se o carregamento passar de 300 ms (cenários lentos).
  pendingMs: 300,
  pendingComponent: NftDetailSkeleton,
  notFoundComponent: () => (
    <NotFoundPage
      title="NFT não encontrado"
      description="Este NFT não existe ou foi removido do mercado. Continue explorando o catálogo."
    />
  ),
  component: NftDetailRoute,
})

function NftDetailRoute() {
  const { id } = Route.useParams()
  const { edicao } = Route.useSearch()
  return <NftDetailPage id={id} editionId={edicao} />
}
