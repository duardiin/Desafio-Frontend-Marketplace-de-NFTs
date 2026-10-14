import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { StatusPage } from '@/features/layout/status-page'
import { toApiError } from '@/api/api-error'

/** Erro inesperado ao carregar uma rota. Permite tentar de novo sem recarregar a página. */
export function RouteErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorBoundary = useQueryErrorResetBoundary()
  const apiError = toApiError(error)

  function retry() {
    queryErrorBoundary.reset()
    reset()
    void router.invalidate()
  }

  return (
    <StatusPage
      eyebrow="Algo deu errado"
      title="Não foi possível carregar"
      description={apiError.message}
      actions={
        <>
          <Button onClick={retry}>Tentar novamente</Button>
          <Button asChild variant="outline">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </>
      }
    />
  )
}
