import type { Quote } from '@/api/contracts/cart'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CouponForm } from '@/features/cart/coupon-form'
import { ComingSoon } from '@/features/layout/coming-soon'
import { formatEth } from '@/lib/eth'

interface CartSummaryProps {
  quote: Quote | undefined
  isLoading: boolean
  isRefreshing: boolean
  isError: boolean
  onRetry: () => void
  couponCode: string | null
}

/**
 * Resumo do pedido. Todos os valores vêm da cotação da API (a referência do
 * checkout); o cliente só formata as strings decimais.
 */
export function CartSummary({ quote, isLoading, isRefreshing, isError, onRetry, couponCode }: CartSummaryProps) {
  const blocked = (quote?.blockers.length ?? 0) > 0

  return (
    <section
      aria-labelledby="resumo-titulo"
      aria-busy={isLoading || isRefreshing}
      className="flex flex-col gap-5 rounded-xl bg-surface-card p-6"
    >
      <h2 id="resumo-titulo" className="text-heading-22 font-bold">
        Resumo do pedido
      </h2>

      <CouponForm appliedCode={couponCode} />

      {isError && !quote ? (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-body-14">
            <span className="font-bold text-destructive">Erro: </span>
            Não foi possível calcular os valores do pedido.
          </p>
          <Button variant="outline" className="border-primary" onClick={onRetry}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <dl className="flex flex-col gap-3 text-body-15">
          <SummaryRow label="Subtotal" value={quote?.subtotalEth} loading={isLoading} />
          <SummaryRow
            label={quote?.coupon ? `Desconto (${quote.coupon.code}, ${quote.coupon.percentOff}%)` : 'Desconto'}
            value={quote?.discountEth}
            loading={isLoading}
            negative
          />
          <SummaryRow label="Taxa de rede" value={quote?.networkFeeEth} loading={isLoading} />
          <div className="mt-1 flex items-center justify-between border-t border-primary/50 pt-4">
            <dt className="text-body-18 font-bold">Total</dt>
            <dd className="text-heading-22 font-bold text-highlight">
              {isLoading || !quote ? <Skeleton className="h-6 w-[130px]" /> : formatEth(quote.totalEth)}
            </dd>
          </div>
        </dl>
      )}

      <p className="min-h-5 text-caption-12 text-muted-foreground" aria-live="polite">
        {isRefreshing ? 'Atualizando valores…' : 'Valores confirmados pela cotação da API.'}
      </p>

      {blocked && (
        <p role="alert" className="text-body-14">
          <span className="font-bold text-destructive">Revise o carrinho: </span>
          há itens esgotados ou acima do disponível.
        </p>
      )}

      {/* Pagamento e pedido entram no bloco P6. */}
      <ComingSoon className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary/60 text-body-16 font-bold text-ink">
        Finalizar compra
      </ComingSoon>
    </section>
  )
}

function SummaryRow({
  label,
  value,
  loading,
  negative = false,
}: {
  label: string
  value: string | undefined
  loading: boolean
  negative?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>
        {loading || value === undefined ? (
          <Skeleton className="h-5 w-[100px]" />
        ) : (
          `${negative && value !== '0' ? '− ' : ''}${formatEth(value)}`
        )}
      </dd>
    </div>
  )
}
