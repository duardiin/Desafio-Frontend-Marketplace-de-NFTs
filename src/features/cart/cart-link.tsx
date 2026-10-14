import { Link } from '@tanstack/react-router'
import cartIcon from '@/assets/figma/icon-cart.svg'
import { cartItemCount, useCart } from '@/features/cart/use-cart'

/** Carrinho do header (Figma): ícone de 24 px com badge `primary` de 16 px e borda `ink`. */
export function CartLink() {
  const cart = useCart()
  const count = cartItemCount(cart.data)
  const label = count === 0 ? 'Carrinho, vazio' : `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`

  return (
    <Link to="/carrinho" aria-label={label} className="relative grid size-7 place-items-center rounded-sm">
      <img src={cartIcon} alt="" width={24} height={24} />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1.5 grid size-4 min-w-4 place-items-center rounded-full border-2 border-ink bg-primary px-0.5 text-tiny-10 font-medium text-ink"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
