import { createFileRoute } from '@tanstack/react-router'
import { WalletsPage } from '@/features/wallets/wallets-page'

export const Route = createFileRoute('/_auth/carteiras')({
  staticData: { navSection: 'inicio', headerDivider: true },
  component: WalletsPage,
})
