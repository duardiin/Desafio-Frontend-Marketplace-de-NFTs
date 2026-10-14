import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { StatusPage } from '@/features/layout/status-page'

interface NotFoundPageProps {
  title?: string
  description?: string
}

export function NotFoundPage({
  title = 'Página não encontrada',
  description = 'O endereço que você acessou não existe ou foi removido. Volte para o início e continue explorando o mercado.',
}: NotFoundPageProps) {
  return (
    <StatusPage
      eyebrow="Erro 404"
      title={title}
      description={description}
      actions={
        <Button asChild>
          <Link to="/">Voltar ao início</Link>
        </Button>
      }
    />
  )
}
