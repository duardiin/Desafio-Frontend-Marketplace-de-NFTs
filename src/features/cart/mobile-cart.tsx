import { Link } from '@tanstack/react-router'
import { Trash2Icon } from 'lucide-react'
import type { CartItem, Quote } from '@/api/contracts/cart'
import { NftImage } from '@/components/nft-image'
import { Skeleton } from '@/components/ui/skeleton'
import { CouponForm } from '@/features/cart/coupon-form'
import { useRemoveCartItem, useUpdateCartItem } from '@/features/cart/use-cart'
import { MobileActionBar } from '@/features/layout/mobile-screen'
import { QuantityStepper } from '@/features/nft/purchase-options'
import { formatEth, sameEth } from '@/lib/eth'

interface MobileCartLineProps {
  item: CartItem
  quoteLine: Quote['lines'][number] | undefined
  blocker: Quote['blockers'][number] | undefined
}

/**
 * Item do carrinho mobile (Figma 16:360): cartão com a arte de 100 px, nome,
 * edição e total da linha (da cotação), seletor compacto e lixeira no canto.
 */
export function MobileCartLine({ item, quoteLine, blocker }: MobileCartLineProps) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const busy = update.isPending || remove.isPending
  const priceChanged = !sameEth(item.priceWhenAddedEth, item.nft.priceEth)

  return (
    <li className="overflow-hidden rounded-2xl bg-surface-card" aria-busy={busy}>
      <div className="relative flex">
        <Link to="/nft/$id" params={{ id: item.nft.id }} className="shrink-0" tabIndex={-1} aria-hidden="true">
          <NftImage image={item.nft.image} sizes="100px" alt="" className="size-[100px] object-cover" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col justify-between py-2.5 pr-2 pl-2.5">
          <div className="min-w-0 pr-7">
            <h3 className="truncate text-body-15 font-bold">
              <Link to="/nft/$id" params={{ id: item.nft.id }} search={{ edicao: item.edition.id }}>
                {item.nft.name}
              </Link>
            </h3>
            <p className="text-body-14 text-muted-foreground">Edição: {item.edition.label}</p>
          </div>
          <div className="flex items-end justify-between gap-2">
            <p className="text-body-18 font-bold text-highlight">
              <span className="sr-only">Total da linha: </span>
              {quoteLine ? formatEth(quoteLine.lineTotalEth) : formatEth(item.nft.priceEth)}
            </p>
            <QuantityStepper
              value={item.quantity}
              max={Math.max(item.maxQuantity, 1)}
              itemName={item.nft.name}
              disabled={busy}
              size="compact-round"
              onChange={(quantity) => update.mutate({ lineId: item.lineId, quantity })}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => remove.mutate({ lineId: item.lineId, name: item.nft.name })}
          disabled={busy}
          aria-label={`Remover ${item.nft.name} do carrinho`}
          className="absolute top-2 right-2 grid size-7 place-items-center rounded-full text-primary outline-none hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
        >
          <Trash2Icon className="size-[18px]" aria-hidden="true" />
        </button>
      </div>

      {(priceChanged || blocker) && (
        <div className="flex flex-col gap-2 px-3 pb-3">
          {priceChanged && (
            <p className="rounded-md border border-border-soft bg-surface-dark px-3 py-2 text-caption-12">
              <span className="font-bold text-highlight">Preço atualizado: </span>
              era {formatEth(item.priceWhenAddedEth)} quando você adicionou, agora é {formatEth(item.nft.priceEth)}.
            </p>
          )}
          {blocker && (
            <p className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-caption-12">
              <span className="font-bold text-destructive">Indisponível: </span>
              {blocker.reason === 'EDITION_SOLD_OUT'
                ? 'esta edição esgotou. Remova o item para continuar.'
                : `restam apenas ${item.maxQuantity} unidade(s) que você pode levar. Ajuste a quantidade.`}
            </p>
          )}
        </div>
      )}
    </li>
  )
}

interface MobileCartSheetProps {
  quote: Quote | undefined
  isLoading: boolean
  isRefreshing: boolean
  isError: boolean
  onRetry: () => void
  couponCode: string | null
}

/**
 * Resumo mobile fixo embaixo (Figma 16:360): cupom em pílula, subtotal,
 * desconto, taxa de rede ("Taxa estimada"), total e "Conectar e finalizar".
 * Os valores vêm da cotação da API.
 */
export function MobileCartSheet({ quote, isLoading, isRefreshing, isError, onRetry, couponCode }: MobileCartSheetProps) {
  const blocked = (quote?.blockers.length ?? 0) > 0

  return (
    <MobileActionBar>
      <section aria-labelledby="resumo-titulo" aria-busy={isLoading || isRefreshing} className="flex flex-col gap-4">
        <h2 id="resumo-titulo" className="sr-only">
          Resumo do pedido
        </h2>
        <CouponForm appliedCode={couponCode} variant="pill" />

        {isError && !quote ? (
          <div role="alert" className="flex items-center justify-between gap-3 text-body-14">
            <p>
              <span className="font-bold text-destructive">Erro: </span>
              Não foi possível calcular os valores.
            </p>
            <button type="button" onClick={onRetry} className="font-bold text-highlight underline">
              Tentar novamente
            </button>
          </div>
        ) : (
          <dl className="flex flex-col gap-2.5 text-body-15">
            <Row label="Subtotal" value={quote?.subtotalEth} loading={isLoading} />
            <Row
              label={quote?.coupon ? `Desconto (${quote.coupon.code})` : 'Desconto do lançamento'}
              value={quote?.discountEth}
              loading={isLoading}
              prefix="(-) "
            />
            <div className="flex items-start justify-between gap-4">
              <dt>Taxa de rede</dt>
              <dd className="flex flex-col items-end">
                {isLoading || !quote ? <Skeleton className="h-5 w-[90px]" /> : formatEth(quote.networkFeeEth)}
                <span className="text-caption-12 leading-4 text-highlight">Taxa estimada</span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-body-16 font-bold">Total</dt>
              <dd className="text-[20px] leading-7 font-bold text-highlight">
                {isLoading || !quote ? <Skeleton className="h-6 w-[110px]" /> : formatEth(quote.totalEth)}
              </dd>
            </div>
          </dl>
        )}

        <p className="sr-only" aria-live="polite">
          {isRefreshing ? 'Atualizando valores…' : 'Valores confirmados pela cotação da API.'}
        </p>
        {blocked && (
          <p role="alert" className="text-body-14">
            <span className="font-bold text-destructive">Revise o carrinho: </span>
            há itens esgotados ou acima do disponível.
          </p>
        )}

        {blocked || isLoading ? (
          <button
            type="button"
            disabled
            className="bg-cta-gradient h-[60px] w-full rounded-full text-body-16 font-bold text-ink opacity-50"
          >
            Conectar e finalizar
          </button>
        ) : (
          <Link
            to="/pagamento"
            className="bg-cta-gradient grid h-[60px] w-full place-items-center rounded-full text-body-16 font-bold text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Conectar e finalizar
          </Link>
        )}
      </section>
    </MobileActionBar>
  )
}

function Row({ label, value, loading, prefix = '' }: { label: string; value: string | undefined; loading: boolean; prefix?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt>{label}</dt>
      <dd>{loading || value === undefined ? <Skeleton className="h-5 w-[90px]" /> : `${prefix}${formatEth(value)}`}</dd>
    </div>
  )
}
