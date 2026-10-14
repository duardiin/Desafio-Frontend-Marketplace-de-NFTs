import { createFileRoute } from '@tanstack/react-router'
import { OrderPage } from '@/features/orders/order-page'

export const Route = createFileRoute('/_auth/pedidos/$id')({
  staticData: { navSection: 'mercado', headerDivider: false },
  component: OrderRoute,
})

function OrderRoute() {
  const { id } = Route.useParams()
  return <OrderPage orderId={id} />
}
