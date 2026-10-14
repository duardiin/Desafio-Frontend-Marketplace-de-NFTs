import { createFileRoute } from '@tanstack/react-router'
import { CartPage } from '@/features/cart/cart-page'

export const Route = createFileRoute('/carrinho')({
  staticData: { navSection: 'mercado', headerDivider: false },
  component: CartPage,
})
