import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { WalletConnection } from '@/api/contracts/checkout'
import type { Quote } from '@/api/contracts/cart'
import type { CreateOrderRequest, Order } from '@/api/contracts/orders'
import { ApiError, toApiError } from '@/api/api-error'
import { privateQueryKey } from '@/features/auth/session-query'
import * as checkoutApi from '@/features/checkout/api'
import { checkoutDraft, purchaseAttempt } from '@/features/checkout/checkout-storage'
import { API_FIELD_MAP, type CheckoutFormValues } from '@/features/checkout/schema'
import { notify } from '@/features/feedback/notifications'

type ConnectionStatus = 'idle' | 'connecting' | 'connected'

/** Conexão simulada com a carteira (POST /checkout/wallet-connection). */
export function useWalletConnection() {
  const [connection, setConnection] = useState<WalletConnection | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function connect(walletId: string, network: CheckoutFormValues['network']) {
    setStatus('connecting')
    setMessage(null)
    try {
      const result = await checkoutApi.connectWallet({ walletId, network })
      setConnection(result)
      setStatus('connected')
      notify('Carteira conectada.', 'success')
    } catch (error) {
      setConnection(null)
      setStatus('idle')
      setMessage(toApiError(error).message)
    }
  }

  async function disconnect(reason?: string) {
    const current = connection
    setConnection(null)
    setStatus('idle')
    setMessage(reason ?? null)
    if (current) await checkoutApi.disconnectWallet(current.id).catch(() => undefined)
  }

  /** Conexão perdida do lado da carteira/servidor (sem chamar a API). */
  function lost(reason: string) {
    setConnection(null)
    setStatus('idle')
    setMessage(reason)
  }

  return { connection, status, message, connect, disconnect, lost }
}

export type ReviewState =
  | { kind: 'closed' }
  | {
      kind: 'open'
      quote: Quote
      /** Valores mudaram na revalidação: exige nova confirmação. */
      changedFrom: Quote | null
      error: string | null
      /** Envio sem resposta conclusiva (timeout/rede): reenviar a MESMA tentativa. */
      uncertain: boolean
    }

interface CheckoutFlowOptions {
  userId: string
  form: UseFormReturn<CheckoutFormValues>
  refetchQuote: () => Promise<Quote | undefined>
  connection: ReturnType<typeof useWalletConnection>
}

/**
 * Revisão e envio do pedido:
 * 1. "Confirmar compra" valida o formulário, exige carteira conectada,
 *    revalida a cotação e abre a revisão;
 * 2. "Confirmar pagamento" revalida de novo: se algo mudou, mostra e exige
 *    nova confirmação; senão cria o pedido com a chave de idempotência.
 */
export function useCheckoutFlow({ userId, form, refetchQuote, connection }: CheckoutFlowOptions) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [review, setReview] = useState<ReviewState>({ kind: 'closed' })
  // Trava síncrona: cobre o intervalo entre o clique e o início da mutation
  // (revalidação da cotação), em que isPending ainda é falso.
  const busyRef = useRef(false)
  const [busy, setBusy] = useState(false)

  async function exclusive(task: () => Promise<void>) {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    try {
      await task()
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  const create = useMutation({
    mutationFn: ({ body, key }: { body: CreateOrderRequest; key: string }) => checkoutApi.createOrder(body, key),
  })

  function patchReview(patch: Partial<Extract<ReviewState, { kind: 'open' }>>) {
    setReview((current) => (current.kind === 'open' ? { ...current, ...patch } : current))
  }

  async function openReview() {
    const valid = await form.trigger(undefined, { shouldFocus: true })
    if (!valid) return
    if (!connection.connection) {
      connection.lost('Conecte a carteira para continuar.')
      return
    }
    const quote = await refetchQuote()
    if (!quote) {
      notify('Não foi possível revalidar os valores do pedido. Tente novamente.', 'error')
      return
    }
    setReview({ kind: 'open', quote, changedFrom: null, error: null, uncertain: false })
  }

  function buildBody(quote: Quote): CreateOrderRequest | null {
    const values = form.getValues()
    if (!connection.connection) return null
    return {
      quoteId: quote.id,
      walletId: values.walletId,
      network: values.network,
      connectionId: connection.connection.id,
      buyer: {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        username: values.username.trim(),
        profileName: values.profileName.trim(),
        referralCode: values.referralCode.trim() || undefined,
        ensName: values.ensName.trim() || undefined,
        secondaryWallet: values.secondaryWallet.trim() || undefined,
        note: values.note.trim() || undefined,
      },
    }
  }

  async function onCreated(order: Order) {
    purchaseAttempt.clear(userId)
    checkoutDraft.clear(userId)
    setReview({ kind: 'closed' })
    await queryClient.invalidateQueries({ queryKey: privateQueryKey(userId, 'orders') })
    void navigate({ to: '/pedidos/$id', params: { id: order.id } })
  }

  async function handleError(error: unknown) {
    const apiError = toApiError(error)
    switch (apiError.kind === 'conflict' || apiError.kind === 'validation' ? apiError.code : apiError.kind) {
      case 'transient':
        patchReview({ uncertain: true, error: null })
        return
      case 'QUOTE_OUTDATED': {
        const fresh = await refetchQuote()
        setReview((current) =>
          current.kind === 'open' && fresh
            ? { ...current, changedFrom: current.quote, quote: fresh, error: null, uncertain: false }
            : current,
        )
        return
      }
      case 'EDITION_SOLD_OUT':
      case 'QUANTITY_LIMIT':
        await refetchQuote()
        patchReview({ error: apiError.message, uncertain: false })
        return
      case 'WALLET_DISCONNECTED':
        setReview({ kind: 'closed' })
        connection.lost(apiError.message)
        return
      case 'IDEMPOTENCY_CONFLICT':
        purchaseAttempt.clear(userId)
        patchReview({ error: 'A tentativa anterior usou outros dados. Confirme novamente.', uncertain: false })
        return
      case 'VALIDATION_FAILED': {
        setReview({ kind: 'closed' })
        for (const [field, messages] of Object.entries(apiError.fieldErrors)) {
          const name = API_FIELD_MAP[field]
          if (name && messages[0]) form.setError(name, { type: 'server', message: messages[0] }, { shouldFocus: true })
        }
        notify(apiError.message, 'error')
        return
      }
      default:
        // Sessão expirada é tratada globalmente (login e volta para /pagamento com o rascunho salvo).
        if (!(error instanceof ApiError && error.kind === 'session')) patchReview({ error: apiError.message })
    }
  }

  async function send(body: CreateOrderRequest, key: string) {
    try {
      await onCreated(await create.mutateAsync({ body, key }))
    } catch (error) {
      await handleError(error)
    }
  }

  const confirmPayment = () =>
    exclusive(async () => {
    if (review.kind !== 'open') return
    const fresh = await refetchQuote()
    if (!fresh) {
      patchReview({ error: 'Não foi possível revalidar os valores. Tente novamente.' })
      return
    }
    if (fresh.id !== review.quote.id) {
      setReview({ ...review, changedFrom: review.quote, quote: fresh, error: null, uncertain: false })
      return
    }
    if (fresh.blockers.length > 0) {
      patchReview({ error: 'Há itens esgotados ou acima do disponível. Revise o carrinho.' })
      return
    }
    const body = buildBody(fresh)
    if (!body) return
    patchReview({ changedFrom: null, error: null })
    await send(body, purchaseAttempt.keyFor(userId, body))
    })

  /** Reenvia exatamente a tentativa salva (mesma chave e corpo): nunca duplica a compra. */
  const retryAttempt = () =>
    exclusive(async () => {
      const attempt = purchaseAttempt.load(userId)
      if (attempt) await send(attempt.body, attempt.key)
    })

  return {
    review,
    openReview,
    confirmPayment,
    retryAttempt,
    closeReview: () => setReview({ kind: 'closed' }),
    submitting: busy || create.isPending,
  }
}
