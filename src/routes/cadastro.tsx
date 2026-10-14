import { createFileRoute } from '@tanstack/react-router'
import { AuthDialog } from '@/features/auth/auth-dialog'
import { redirectIfAuthenticated, validateAuthSearch } from '@/features/auth/auth-route'
import { HomePage } from '@/features/home/home-page'

export const Route = createFileRoute('/cadastro')({
  staticData: { navSection: 'inicio', headerDivider: true },
  validateSearch: validateAuthSearch,
  beforeLoad: ({ context, search }) => redirectIfAuthenticated(context.queryClient, search),
  component: RegisterRoute,
})

function RegisterRoute() {
  const search = Route.useSearch()
  return (
    <>
      <HomePage />
      <AuthDialog mode="cadastro" {...search} />
    </>
  )
}
