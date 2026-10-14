import { createFileRoute } from '@tanstack/react-router'
import { FavoritesPage } from '@/features/favorites/favorites-page'

export const Route = createFileRoute('/_auth/favoritos')({
  staticData: { navSection: 'inicio', headerDivider: true },
  component: FavoritesPage,
})
