import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/features/profile/profile-page'

export const Route = createFileRoute('/_auth/perfil')({
  staticData: { navSection: 'inicio', headerDivider: true },
  component: ProfilePage,
})
