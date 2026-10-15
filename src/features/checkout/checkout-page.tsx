import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { SessionUser } from '@/api/contracts/auth'
import type { Profile } from '@/api/contracts/profile'
import type { Wallet } from '@/api/contracts/wallets'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentUser } from '@/features/auth/session-query'
import { useCart, useQuote } from '@/features/cart/use-cart'
import { pendingOrdersQueryOptions } from '@/features/checkout/api'
import { checkoutDraft, purchaseAttempt } from '@/features/checkout/checkout-storage'
import { CheckoutSummary } from '@/features/checkout/checkout-summary'
import { CollectorForm } from '@/features/checkout/collector-form'
import { ReviewDialog } from '@/features/checkout/review-dialog'
import { checkoutSchema, type CheckoutFormValues } from '@/features/checkout/schema'
import { useCheckoutFlow, useWalletConnection } from '@/features/checkout/use-checkout'
import { MobileCheckoutBar, MobileCollapsible, MobileProviderPicker, MobileWalletPicker } from '@/features/checkout/mobile-checkout'
import { WalletConnectionControl, WalletSection } from '@/features/checkout/wallet-section'
import { MobileTopBar } from '@/features/layout/mobile-screen'
import { formatEth } from '@/lib/eth'
import { useMediaQuery } from '@/lib/use-media-query'
import { profileQueryOptions } from '@/features/profile/api'
import { walletsQueryOptions } from '@/features/wallets/api'

/** Pagamento (Figma 11:2862 no desktop; 16:748 no mobile). Rota privada: `user` só é nulo durante o logout. */
export function CheckoutPage() {
  const user = useCurrentUser()
  if (!user) return null
  return <CheckoutLoader user={user} />
}

function CheckoutLoader({ user }: { user: SessionUser }) {
  const cart = useCart()
  const profile = useQuery(profileQueryOptions(user.id))
  const wallets = useQuery(walletsQueryOptions(user.id))
  // Com uma tentativa de compra sem resposta, o pagamento continua montado mesmo
  // se o carrinho esvaziar (o pedido pode ter sido confirmado e retirado os
  // itens): a revisão e o "Tentar de novo" não podem sumir.
  const hasAttempt = purchaseAttempt.load(user.id) !== null
  const hasItems = (cart.data?.items.length ?? 0) > 0
  const isDesktop = useMediaQuery('(min-width: 768px)')

  return (
    <>
    {/* Mobile (Figma 16:748): topo com voltar e título, no lugar da trilha. */}
    {!isDesktop && <MobileTopBar title="Pagamento com carteira" fallback="/carrinho" />}
    <div className="container-page flex flex-col gap-8 md:mt-6">
      {isDesktop && (
      <nav aria-label="Trilha de navegação" className="text-body-15 font-bold">
        <ol className="flex gap-1">
          <li>
            <Link to="/" className="hover:text-highlight">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/carrinho" className="hover:text-highlight">
              Mercado
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Pagamento</li>
        </ol>
      </nav>
      )}
      {isDesktop && <h1 className="sr-only">Pagamento</h1>}

      {(cart.isPending || profile.isPending || wallets.isPending) && <CheckoutSkeleton />}

      {(cart.isError || profile.isError || wallets.isError) && (
        <div role="alert" className="flex flex-col items-start gap-3 bg-surface-card p-6">
          <p className="text-body-16">
            <span className="font-bold text-destructive">Erro: </span>
            Não foi possível carregar os dados do pagamento.
          </p>
          <Button onClick={() => void Promise.all([cart.refetch(), profile.refetch(), wallets.refetch()])}>
            Tentar novamente
          </Button>
        </div>
      )}

      {cart.isSuccess && !hasItems && !hasAttempt && <EmptyCheckout userId={user.id} />}

      {cart.isSuccess && (hasItems || hasAttempt) && profile.isSuccess && wallets.isSuccess && (
        <CheckoutContent user={user} profile={profile.data} wallets={wallets.data.items} isDesktop={isDesktop} />
      )}
    </div>
    </>
  )
}

function initialValues(userId: string, profile: Profile, wallets: Wallet[]): CheckoutFormValues {
  const wallet = wallets.find((item) => item.role === 'principal') ?? wallets[0]
  const draft = checkoutDraft.load(userId) ?? {}
  return {
    fullName: profile.displayName,
    username: profile.username,
    profileName: profile.displayName,
    email: profile.email,
    walletId: wallet?.id ?? '',
    network: wallet?.networks[0] ?? 'ethereum',
    secondaryWallet: '',
    referralCode: '',
    // O campo do Pagamento aceita só o nome .eth; vem do perfil quando houver.
    ensName: profile.ensName.endsWith('.eth') ? profile.ensName.slice(0, -'.eth'.length) : '',
    note: '',
    // O rascunho salvo (ex.: antes de a sessão expirar) tem prioridade.
    ...draft,
  }
}

function CheckoutContent({
  user,
  profile,
  wallets,
  isDesktop,
}: {
  user: SessionUser
  profile: Profile
  wallets: Wallet[]
  isDesktop: boolean
}) {
  const cart = useCart()
  const quote = useQuote()
  const pending = useQuery(pendingOrdersQueryOptions(user.id))
  const [initial] = useState(() => initialValues(user.id, profile, wallets))
  const form = useForm<CheckoutFormValues>({ resolver: zodResolver(checkoutSchema), defaultValues: initial })
  const connection = useWalletConnection()
  const [savedAttempt] = useState(() => purchaseAttempt.load(user.id))

  const flow = useCheckoutFlow({
    userId: user.id,
    form,
    connection,
    refetchQuote: async () => (await quote.refetch()).data,
  })

  // Rascunho no sessionStorage: retomada após refresh ou expiração da sessão.
  const allValues = useWatch({ control: form.control })
  useEffect(() => checkoutDraft.save(user.id, allValues), [allValues, user.id])

  // Trocar carteira ou rede invalida a conexão anterior.
  const walletId = useWatch({ control: form.control, name: 'walletId' })
  const network = useWatch({ control: form.control, name: 'network' })
  const { connection: active, disconnect } = connection
  useEffect(() => {
    if (active && (active.walletId !== walletId || active.network !== network)) {
      void disconnect('Carteira ou rede alterada: conecte novamente.')
    }
  }, [active, disconnect, walletId, network])

  const pendingOrder = pending.data?.items[0]
  const values = form.getValues()
  // Mobile: seções recolhíveis para o que o frame não mostra; abrem sozinhas com erro.
  const [dataOpen, setDataOpen] = useState(false)
  const [itemsOpen, setItemsOpen] = useState(false)
  const hasFieldErrors = Object.keys(form.formState.errors).length > 0
  const items = cart.data?.items ?? []
  const blockersAlert = quote.data && quote.data.blockers.length > 0 && (
    <p role="alert" className="text-body-14">
      <span className="font-bold text-destructive">Revise o carrinho: </span>
      há itens esgotados ou acima do disponível.{' '}
      <Link to="/carrinho" className="font-bold text-highlight underline">
        Ir para o carrinho
      </Link>
    </p>
  )

  if (wallets.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 bg-surface-card p-6">
        <p className="text-body-16 font-bold">Você ainda não tem carteiras cadastradas.</p>
        <p className="text-body-14 text-muted-foreground">Cadastre uma carteira para pagar seus NFTs.</p>
      </div>
    )
  }

  return (
    <>
      {pendingOrder && (
        <p role="status" className="rounded-md border border-primary bg-surface-dark px-4 py-3 text-body-14">
          <span className="font-bold text-highlight">Você tem um pedido aguardando confirmação.</span>{' '}
          <Link to="/pedidos/$id" params={{ id: pendingOrder.id }} className="font-bold underline">
            Acompanhar pedido
          </Link>{' '}
          antes de comprar de novo.
        </p>
      )}
      {savedAttempt && !pendingOrder && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-md border border-primary bg-surface-dark px-4 py-3 text-body-14">
          <span>
            <span className="font-bold text-highlight">Há uma tentativa de compra sem confirmação.</span> Verificar reenvia a
            mesma tentativa, sem duplicar a compra.
          </span>
          <Button size="sm" onClick={() => void flow.retryAttempt()} disabled={flow.submitting}>
            Verificar tentativa
          </Button>
        </div>
      )}

      {!isDesktop && (
        <>
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              void flow.openReview()
            }}
            className="flex flex-col gap-8 pb-[190px]"
          >
            <MobileWalletPicker form={form} wallets={wallets} />
            <MobileProviderPicker form={form} wallets={wallets} />
            <WalletConnectionControl walletId={walletId} network={network} connection={connection} variant="pill" />
            {blockersAlert}
            <div className="flex flex-col gap-4">
              <MobileCollapsible
                title="Dados do colecionador"
                summary={`${values.fullName} · ${values.email}`}
                open={dataOpen || hasFieldErrors}
                onToggle={setDataOpen}
              >
                <CollectorForm form={form} wallets={wallets} compact />
              </MobileCollapsible>
              <MobileCollapsible
                title="Itens e valores"
                summary={`${items.length} ${items.length === 1 ? 'NFT' : 'NFTs'}${quote.data ? ` · ${formatEth(quote.data.totalEth)}` : ''}`}
                open={itemsOpen}
                onToggle={setItemsOpen}
              >
                <CheckoutSummary items={items} quote={quote.data} />
              </MobileCollapsible>
            </div>
          </form>
          <MobileCheckoutBar quote={quote.data} submitting={flow.submitting} onConfirm={() => void flow.openReview()} />
        </>
      )}

      {isDesktop && (
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void flow.openReview()
        }}
        className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_405px]"
      >
        <CollectorForm form={form} wallets={wallets} />
        <div className="flex flex-col gap-6">
          <CheckoutSummary items={items} quote={quote.data} />
          {blockersAlert}
          <WalletSection
            form={form}
            wallets={wallets}
            connection={connection}
            submitting={flow.submitting}
            onConfirm={() => void flow.openReview()}
          />
        </div>
      </form>
      )}

      <ReviewDialog
        review={flow.review}
        wallet={wallets.find((item) => item.id === values.walletId)}
        network={values.network}
        buyer={{ fullName: values.fullName, email: values.email }}
        submitting={flow.submitting}
        onConfirm={() => void flow.confirmPayment()}
        onRetry={() => void flow.retryAttempt()}
        onClose={flow.closeReview}
      />
    </>
  )
}

function EmptyCheckout({ userId }: { userId: string }) {
  const pending = useQuery(pendingOrdersQueryOptions(userId))
  const order = pending.data?.items[0]
  return (
    <div className="flex flex-col items-start gap-3 bg-surface-card p-6">
      <p className="text-body-16 font-bold">Não há itens para pagar.</p>
      {order ? (
        <Button asChild>
          <Link to="/pedidos/$id" params={{ id: order.id }}>
            Acompanhar pedido em andamento
          </Link>
        </Button>
      ) : (
        <Button asChild>
          <Link to="/" hash="catalogo">
            Explorar o catálogo
          </Link>
        </Button>
      )}
    </div>
  )
}

function CheckoutSkeleton() {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_405px]" aria-busy="true">
      <span role="status" className="sr-only">
        Carregando pagamento…
      </span>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton key={index} className="h-[69px] w-full" />
        ))}
      </div>
      <Skeleton className="h-[520px] w-full rounded-xl" />
    </div>
  )
}
