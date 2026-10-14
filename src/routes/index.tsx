import { createFileRoute } from '@tanstack/react-router'
import { validateCatalogSearch } from '@/features/catalog/search-params'
import { HomePage } from '@/features/home/home-page'

export const Route = createFileRoute('/')({
  staticData: { navSection: 'inicio', headerDivider: true },
  validateSearch: validateCatalogSearch,
  component: HomeRoute,
})

function HomeRoute() {
  return <HomePage search={Route.useSearch()} />
}
