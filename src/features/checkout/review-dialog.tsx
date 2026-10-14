import { Link } from '@tanstack/react-router'
import type { Quote } from '@/api/contracts/cart'
import { NETWORK_LABELS, type Network } from '@/api/contracts/common'
import type { Wallet } from '@/api/contracts/wallets'
import { WALLET_PROVIDER_LABELS } from '@/api/contracts/wallets'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { ReviewState } from '@/features/checkout/use-checkout'
import { shortAddress } from '@/features/wallets/api'
import { formatEth, sameEth } from '@/lib/eth'

interface ReviewDialogProps {
  review: ReviewState
  wallet: Wallet | undefined
  network: Network
  buyer: { fullName: string; email: string }
  submitting: boolean
  onConfirm: () => void
  onRetry: () => void
  onClose: () => void
}

/** Revisão antes do envio. Mudanças na revalidação aparecem aqui e exigem nova confirmação. */
export function ReviewDialog({ review, wallet, network, buyer, submitting, onConfirm, onRetry, onClose }: ReviewDialogProps) {
  if (review.kind !== 'open') return null
  const { quote, changedFrom, error, uncertain } = review

  return (
    <Dialog open onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto bg-surface-card p-6 sm:max-w-[560px]">
        <DialogTitle>Revise seu pedido</DialogTitle>
        <DialogDescription>Confira itens, valores e carteira antes de confirmar o pagamento.</DialogDescription>

        {changedFrom && <ChangeNotice before={changedFrom} after={quote} />}

        <ul className="flex flex-col gap-2 text-body-14">
          {quote.lines.map((line) => (
            <li key={line.lineId} className="flex justify-between gap-3">
              <span>
                {line.quantity} × {line.name} <span className="text-muted-foreground">(edição {line.editionLabel})</span>
              </span>
              <span className="shrink-0 font-bold">{formatEth(line.lineTotalEth)}</span>
            </li>
          ))}
        </ul>

        <dl className="flex flex-col gap-1.5 border-t border-primary/50 pt-3 text-body-14">
          <Row label="Subtotal" value={formatEth(quote.subtotalEth)} />
          <Row label={quote.coupon ? `Desconto (${quote.coupon.code})` : 'Desconto'} value={`− ${formatEth(quote.discountEth)}`} />
          <Row label="Taxa de rede" value={formatEth(quote.networkFeeEth)} />
          <div className="mt-1 flex justify-between text-body-18 font-bold">
            <dt>Total</dt>
            <dd className="text-highlight">{formatEth(quote.totalEth)}</dd>
          </div>
        </dl>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md bg-surface-dark p-3 text-body-14">
          <dt className="text-muted-foreground">Carteira</dt>
          <dd>
            {wallet ? `${WALLET_PROVIDER_LABELS[wallet.provider]} · ${shortAddress(wallet.address)}` : '—'}
          </dd>
          <dt className="text-muted-foreground">Rede</dt>
          <dd>{NETWORK_LABELS[network]}</dd>
          <dt className="text-muted-foreground">Colecionador</dt>
          <dd className="break-all">
            {buyer.fullName} · {buyer.email}
          </dd>
        </dl>

        {error && (
          <p role="alert" className="text-body-14">
            <span className="font-bold text-destructive">Erro: </span>
            {error}{' '}
            <Link to="/carrinho" className="font-bold text-highlight underline">
              Revisar carrinho
            </Link>
          </p>
        )}

        {uncertain ? (
          <div role="alert" className="flex flex-col gap-3 rounded-md border border-border-soft bg-surface-dark p-3">
            <p className="text-body-14">
              <span className="font-bold text-highlight">Não recebemos a confirmação do pedido.</span> Ele pode ter sido
              criado. Tentar de novo reenvia a mesma tentativa e não gera uma compra duplicada.
            </p>
            <Button onClick={onRetry} disabled={submitting}>
              {submitting ? 'Verificando…' : 'Tentar de novo'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="border-primary" onClick={onClose} disabled={submitting}>
              Voltar e editar
            </Button>
            <Button onClick={onConfirm} disabled={submitting || quote.blockers.length > 0}>
              {submitting ? 'Enviando pedido…' : changedFrom ? 'Confirmar novos valores' : 'Confirmar pagamento'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

/** O que mudou entre a cotação revisada e a atual (preço, disponibilidade, cupom ou taxa). */
function ChangeNotice({ before, after }: { before: Quote; after: Quote }) {
  const changedLines = after.lines.filter((line) => {
    const previous = before.lines.find((item) => item.lineId === line.lineId)
    return !previous || !sameEth(previous.unitPriceEth, line.unitPriceEth) || previous.quantity !== line.quantity
  })
  return (
    <div role="alert" className="rounded-md border border-primary bg-surface-dark p-3 text-body-14">
      <p className="font-bold text-highlight">Os valores do pedido mudaram.</p>
      <ul className="mt-1 list-disc pl-5">
        {changedLines.map((line) => {
          const previous = before.lines.find((item) => item.lineId === line.lineId)
          return (
            <li key={line.lineId}>
              {line.name}: {previous ? `${formatEth(previous.unitPriceEth)} → ` : ''}
              {formatEth(line.unitPriceEth)}
            </li>
          )
        })}
        {!sameEth(before.totalEth, after.totalEth) && (
          <li>
            Total: {formatEth(before.totalEth)} → {formatEth(after.totalEth)}
          </li>
        )}
        {after.blockers.length > 0 && <li>Há itens esgotados ou acima do disponível.</li>}
      </ul>
      <p className="mt-1">Confirme novamente para continuar.</p>
    </div>
  )
}
