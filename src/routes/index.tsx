import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/features/home/home-page'

export const Route = createFileRoute('/')({
  staticData: { navSection: 'inicio', headerDivider: true },
  component: HomePage,
})
