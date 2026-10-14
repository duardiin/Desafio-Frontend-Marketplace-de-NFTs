import { useNavigate } from '@tanstack/react-router'
import { toApiError } from '@/api/api-error'
import { Button } from '@/components/ui/button'
import { useAddToCart } from '@/features/cart/use-cart'
import { notify } from '@/features/feedback/notifications'

interface BuyButtonProps {
  nftId: string
  nftName: string
  editionId: string | undefined
  editionLabel: string | undefined
  quantity: number
  disabled: boolean
}

/** "COMPRAR" do detalhe (Figma): adiciona a edição e a quantidade escolhidas e abre o carrinho. */
export function BuyButton({ nftId, nftName, editionId, editionLabel, quantity, disabled }: BuyButtonProps) {
  const navigate = useNavigate()
  const add = useAddToCart()

  function handleClick() {
    if (!editionId) return
    add.mutate(
      { nftId, editionId, quantity },
      {
        onSuccess: () => {
          notify(`${quantity} × "${nftName}" (edição ${editionLabel}) no carrinho.`, 'success')
          void navigate({ to: '/carrinho' })
        },
        onError: (error) => notify(toApiError(error).message, 'error'),
      },
    )
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled || !editionId || add.isPending}
      className="h-10 w-[130px] text-body-14 font-bold"
    >
      {add.isPending ? 'ADICIONANDO…' : 'COMPRAR'}
    </Button>
  )
}
