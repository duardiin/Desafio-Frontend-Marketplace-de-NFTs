import { useNavigate } from '@tanstack/react-router'
import { toApiError } from '@/api/api-error'
import cartIcon from '@/assets/figma/m-tab-cart.svg'
import { Button } from '@/components/ui/button'
import { useAddToCart } from '@/features/cart/use-cart'
import { notify } from '@/features/feedback/notifications'
import { cn } from '@/lib/utils'

interface BuyButtonProps {
  nftId: string
  nftName: string
  editionId: string | undefined
  editionLabel: string | undefined
  quantity: number
  disabled: boolean
  /**
   * `desktop`: "COMPRAR" (Figma 10:244), adiciona e abre o carrinho.
   * `mobile`: "Comprar NFT" (Figma 15:5536), adiciona e abre o carrinho.
   * `mobile-cart`: botão redondo do carrinho, adiciona e continua na página.
   */
  variant?: 'desktop' | 'mobile' | 'mobile-cart'
}

/** Compra do detalhe: adiciona a edição e a quantidade escolhidas ao carrinho. */
export function BuyButton({ nftId, nftName, editionId, editionLabel, quantity, disabled, variant = 'desktop' }: BuyButtonProps) {
  const navigate = useNavigate()
  const add = useAddToCart()
  const stayOnPage = variant === 'mobile-cart'

  function handleClick() {
    if (!editionId) return
    add.mutate(
      { nftId, editionId, quantity },
      {
        onSuccess: () => {
          notify(`${quantity} × "${nftName}" (edição ${editionLabel}) no carrinho.`, 'success')
          if (!stayOnPage) void navigate({ to: '/carrinho' })
        },
        onError: (error) => notify(toApiError(error).message, 'error'),
      },
    )
  }

  const isDisabled = disabled || !editionId || add.isPending

  if (variant === 'mobile-cart') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-label={add.isPending ? 'Adicionando ao carrinho…' : 'Adicionar ao carrinho'}
        className="grid size-[60px] shrink-0 place-items-center rounded-full border border-border bg-surface-raised text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
      >
        {/* Ícone do carrinho do Figma recolorido em `primary` por máscara. */}
        <span
          aria-hidden="true"
          className="block size-5 bg-current"
          style={{ maskImage: `url("${cartIcon}")`, maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center' }}
        />
      </button>
    )
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        'font-bold',
        variant === 'mobile'
          ? 'bg-cta-gradient h-[60px] flex-1 rounded-full text-body-16 text-ink hover:opacity-90'
          : 'h-10 w-[130px] text-body-14',
      )}
    >
      {variant === 'mobile'
        ? add.isPending
          ? 'Adicionando…'
          : 'Comprar NFT'
        : add.isPending
          ? 'ADICIONANDO…'
          : 'COMPRAR'}
    </Button>
  )
}
