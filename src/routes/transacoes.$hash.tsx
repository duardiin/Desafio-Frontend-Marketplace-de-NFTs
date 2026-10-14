import { createFileRoute } from '@tanstack/react-router'
import { StatusPage } from '@/features/layout/status-page'

/**
 * "Link de exploração" do recibo. Não existe blockchain: a página deixa claro
 * que a referência é simulada, em vez de levar a um explorador real.
 */
export const Route = createFileRoute('/transacoes/$hash')({
  staticData: { navSection: 'mercado', headerDivider: false },
  component: TransactionRoute,
})

function TransactionRoute() {
  const { hash } = Route.useParams()
  return (
    <StatusPage
      eyebrow="Explorador simulado"
      title="Transação simulada"
      description={`Referência ${hash}. Esta transação foi gerada pela simulação de pagamento da Kurio e não existe em uma rede real.`}
      actions={null}
    />
  )
}
