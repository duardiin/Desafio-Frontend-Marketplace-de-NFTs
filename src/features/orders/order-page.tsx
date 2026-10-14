import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CheckCircle2Icon, LoaderCircleIcon, XCircleIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Order } from '@/api/contracts/orders'
import { NETWORK_LABELS } from '@/api/contracts/common'
import { WALLET_PROVIDER_LABELS } from '@/api/contracts/wallets'
import { NftImage } from '@/components/nft-image'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { privateQueryKey, useCurrentUser } from '@/features/auth/session-query'
import { orderQueryOptions } from '@/features/checkout/api'
import { notify } from '@/features/feedback/notifications'
import { shortAddress } from '@/features/wallets/api'
import { formatEth } from '@/lib/eth'

/** Enquanto pendente, consulta o pedido periodicamente (o tempo real entra no P7). */
const PENDING_POLL_MS = 1500
const DATE = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function OrderPage({ orderId }: { orderId: string }) {
  const user = useCurrentUser()
  if (!user) return null
  return <OrderContent userId={user.id} orderId={orderId} />
}

function OrderContent({ userId, orderId }: { userId: string; orderId: string }) {
  const queryClient = useQueryClient()
  const order = useQuery({
    ...orderQueryOptions(userId, orderId),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? PENDING_POLL_MS : false),
  })
  const status = order.data?.status
  const previousStatus = useRef(status)
  const [confirmationOpen, setConfirmationOpen] = useState(true)

  // Ao sair de "pendente": atualiza carrinho, catálogo e avisa (feedback acessível).
  useEffect(() => {
    if (previousStatus.current === 'pending' && status && status !== 'pending') {
      void queryClient.invalidateQueries({ queryKey: privateQueryKey(userId, 'cart') })
      void queryClient.invalidateQueries({ queryKey: privateQueryKey(userId, 'orders') })
      void queryClient.invalidateQueries({ queryKey: ['nfts'] })
      notify(status === 'confirmed' ? 'Pagamento confirmado.' : 'Pagamento recusado.', status === 'confirmed' ? 'success' : 'error')
    }
    previousStatus.current = status
  }, [queryClient, status, userId])

  return (
    <section className="container-page mt-6 flex flex-col gap-6" aria-labelledby="pedido-titulo">
      <nav aria-label="Trilha de navegação" className="text-body-15 font-bold">
        <ol className="flex gap-1">
          <li>
            <Link to="/" className="hover:text-highlight">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>Mercado</li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Pedido</li>
        </ol>
      </nav>

      {order.isPending && (
        <div aria-busy="true" className="flex flex-col gap-4">
          <span role="status" className="sr-only">
            Carregando pedido…
          </span>
          <Skeleton className="h-9 w-1/2" />
          <Skeleton className="h-[320px] w-full rounded-xl" />
        </div>
      )}

      {order.isError && (
        <div role="alert" className="flex flex-col items-start gap-3 bg-surface-card p-6">
          <h1 id="pedido-titulo" className="text-heading-24 font-bold">
            Pedido indisponível
          </h1>
          <p className="text-body-14">{order.error.message}</p>
          <Button onClick={() => void order.refetch()}>Tentar novamente</Button>
        </div>
      )}

      {order.data && (
        <>
          <StatusBanner order={order.data} />
          {order.data.status === 'confirmed' && <Receipt order={order.data} />}
          {order.data.status === 'confirmed' && (
            <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
              <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-surface-card p-6 sm:max-w-[600px]">
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-6 text-highlight" aria-hidden="true" />
                  Pedido confirmado
                </DialogTitle>
                <DialogDescription>Seu pagamento foi confirmado pela rede. Este é o recibo do pedido.</DialogDescription>
                <Receipt order={order.data} compact />
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" className="border-primary" onClick={() => setConfirmationOpen(false)}>
                    Ver recibo completo
                  </Button>
                  <Button asChild>
                    <Link to="/" hash="catalogo">
                      Continuar explorando
                    </Link>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </section>
  )
}

function StatusBanner({ order }: { order: Order }) {
  if (order.status === 'pending') {
    return (
      <div role="status" className="flex flex-col gap-2 rounded-xl bg-surface-card p-6">
        <h1 id="pedido-titulo" className="flex items-center gap-3 text-heading-24 font-bold">
          <LoaderCircleIcon className="size-6 animate-spin text-highlight motion-reduce:animate-none" aria-hidden="true" />
          Aguardando confirmação
        </h1>
        <p className="text-body-14 text-muted-foreground">
          Pedido {order.id} enviado. A rede está confirmando o pagamento; você pode recarregar ou sair desta página sem
          perder o pedido.
        </p>
      </div>
    )
  }
  if (order.status === 'declined') {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive bg-surface-card p-6">
        <h1 id="pedido-titulo" className="flex items-center gap-3 text-heading-24 font-bold">
          <XCircleIcon className="size-6 text-destructive" aria-hidden="true" />
          Pagamento recusado
        </h1>
        <p className="text-body-14">{order.failureReason ?? 'A carteira recusou o pagamento.'}</p>
        <p className="text-body-14 text-muted-foreground">Nada foi cobrado e os itens continuam no seu carrinho.</p>
        <Button asChild>
          <Link to="/pagamento">Tentar novamente</Link>
        </Button>
      </div>
    )
  }
  return (
    <h1 id="pedido-titulo" className="flex items-center gap-3 text-heading-28 font-bold">
      <CheckCircle2Icon className="size-7 text-highlight" aria-hidden="true" />
      Pedido confirmado
    </h1>
  )
}

/** Recibo: snapshot do pedido (valores gravados na compra; não mudam com o catálogo). */
function Receipt({ order, compact = false }: { order: Order; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-card p-5 text-body-14">
      <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
        <dt className="text-muted-foreground">Pedido</dt>
        <dd>{order.id}</dd>
        <dt className="text-muted-foreground">Transação</dt>
        <dd className="break-all">
          {order.transaction ? (
            <Link
              to="/transacoes/$hash"
              params={{ hash: order.transaction.hash }}
              className="font-bold text-highlight underline-offset-4 hover:underline"
            >
              {shortAddress(order.transaction.hash)}
              <span className="sr-only"> (ver referência simulada)</span>
            </Link>
          ) : (
            '—'
          )}
        </dd>
        {!compact && (
          <>
            <dt className="text-muted-foreground">Data</dt>
            <dd>{DATE.format(new Date(order.updatedAt))}</dd>
            <dt className="text-muted-foreground">Carteira</dt>
            <dd>
              {WALLET_PROVIDER_LABELS[order.wallet.provider]} · {shortAddress(order.wallet.address)}
            </dd>
            <dt className="text-muted-foreground">Rede</dt>
            <dd>{NETWORK_LABELS[order.network]}</dd>
            <dt className="text-muted-foreground">Colecionador</dt>
            <dd className="break-all">
              {order.buyer.fullName} · {order.buyer.email}
            </dd>
          </>
        )}
      </dl>

      <ul aria-label="Itens do pedido" className="flex flex-col gap-2">
        {order.lines.map((line) => (
          <li key={`${line.nftId}-${line.editionId}`} className="flex items-center gap-3">
            {!compact && <NftImage image={line.image} sizes="56px" alt="" className="size-14 rounded-xl object-cover" />}
            <span className="flex-1">
              {line.quantity} × {line.name}{' '}
              <span className="text-muted-foreground">
                (edição {line.editionLabel}, {formatEth(line.unitPriceEth)} cada)
              </span>
            </span>
            <span className="font-bold">{formatEth(line.lineTotalEth)}</span>
          </li>
        ))}
      </ul>

      <dl className="flex flex-col gap-1 border-t border-primary/50 pt-3">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{formatEth(order.subtotalEth)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Desconto{order.couponCode ? ` (${order.couponCode})` : ''}</dt>
          <dd>− {formatEth(order.discountEth)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Taxa de rede</dt>
          <dd>{formatEth(order.networkFeeEth)}</dd>
        </div>
        <div className="flex justify-between text-body-18 font-bold">
          <dt>Total</dt>
          <dd className="text-highlight">{formatEth(order.totalEth)}</dd>
        </div>
      </dl>
    </div>
  )
}
