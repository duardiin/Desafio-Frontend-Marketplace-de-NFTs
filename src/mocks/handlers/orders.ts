import { delay, http, HttpResponse } from 'msw'
import type { OrderListResponse, CreateOrderRequest } from '@/api/contracts/orders'
import { env } from '@/config/env'
import { commit, getDb } from '@/mocks/db/store'
import type { CartLineRecord, DbChange, OrderRecord } from '@/mocks/db/schema'
import { findEdition, touchNft } from '@/mocks/domain/catalog'
import { buildQuote, getCart } from '@/mocks/domain/cart'
import {
  scheduleSettlement,
  settleDueOrders,
  SETTLE_DELAY_MS,
  toOrderResponse,
} from '@/mocks/domain/orders'
import { api } from '@/mocks/handlers/paths'
import { fnv1a } from '@/mocks/lib/hash'
import { apiError, nowIso, readJson, requireUser, validationError } from '@/mocks/lib/http'
import { isNetwork, validateDisplayName, validateEmail } from '@/mocks/lib/validation'
import { withNetwork } from '@/mocks/network'
import { getActiveScenario } from '@/mocks/scenarios'
import Decimal from 'decimal.js'
import { toEth } from '@/mocks/lib/eth'

// Cenários de compra disparam uma única vez por carregamento da página.
const firedScenarios = new Set<string>()
const timedOutKeys = new Set<string>()

function fireOnce(name: string): boolean {
  if (firedScenarios.has(name)) return false
  firedScenarios.add(name)
  return true
}

/** Cenários "preco-alterado" e "edicao-esgotada": mudam o NFT antes da validação do pedido. */
function applyPurchaseScenario(line: CartLineRecord | undefined): DbChange[] {
  const scenario = getActiveScenario()
  const db = getDb()
  const nft = db.nfts.find((item) => item.id === line?.nftId)
  const edition = nft && line && findEdition(nft, line.editionId)
  if (!nft || !edition) return []

  if (scenario === 'preco-alterado' && fireOnce(scenario)) {
    nft.priceEth = toEth(new Decimal(nft.priceEth).plus('0.10'))
  } else if (scenario === 'edicao-esgotada' && fireOnce(scenario)) {
    edition.available = 0
  } else {
    return []
  }
  touchNft(nft)
  return [{ type: 'nft.updated', nftId: nft.id }]
}

export const orderHandlers = [
  http.post(
    api('/orders'),
    withNetwork('orders', async ({ request }) => {
      const user = requireUser(request)
      const key = request.headers.get('Idempotency-Key')?.trim()
      if (!key) return validationError({ idempotencyKey: ['Envie o header Idempotency-Key.'] })

      const body = await readJson<CreateOrderRequest>(request)
      const requestHash = fnv1a(JSON.stringify([body.quoteId, body.walletId, body.network, body.buyer]))
      const db = getDb()
      settleDueOrders()

      // Idempotência: mesma chave devolve o mesmo pedido; corpo diferente é conflito.
      const previous = db.idempotency[key]
      if (previous) {
        if (previous.userId !== user.id || previous.requestHash !== requestHash) {
          return apiError(409, 'IDEMPOTENCY_CONFLICT', 'Esta tentativa de compra já foi usada com outros dados.')
        }
        const order = db.orders.find((item) => item.id === previous.orderId)
        if (order) return HttpResponse.json(toOrderResponse(order), { status: 200 })
      }

      const fieldErrors = {
        ...validateDisplayName(body.buyer?.fullName, 'buyer.fullName'),
        ...validateEmail(body.buyer?.email, 'buyer.email'),
        ...(isNetwork(body.network) ? {} : { network: ['Selecione uma rede.'] }),
      }
      if (Object.keys(fieldErrors).length > 0) return validationError(fieldErrors)

      const wallet = db.wallets.find((item) => item.id === body.walletId)
      if (!wallet) return apiError(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada.')
      if (wallet.userId !== user.id) return apiError(403, 'FORBIDDEN', 'Esta carteira não pertence à sua conta.')
      if (!isNetwork(body.network) || !wallet.networks.includes(body.network)) {
        return apiError(409, 'WALLET_NETWORK_MISMATCH', 'A carteira escolhida não opera nesta rede.')
      }

      const cart = getCart(db, `user:${user.id}`)
      const scenarioChanges = applyPurchaseScenario(cart.lines[0])
      if (scenarioChanges.length > 0) commit(scenarioChanges)

      const quote = buildQuote(db, cart)
      if (quote.lines.length === 0) return validationError({ cart: ['Seu carrinho está vazio.'] })
      if (quote.blockers.length > 0) {
        const soldOut = quote.blockers.some((blocker) => blocker.reason === 'EDITION_SOLD_OUT')
        return soldOut
          ? apiError(409, 'EDITION_SOLD_OUT', 'Um item do carrinho esgotou. Revise o pedido.')
          : apiError(409, 'QUANTITY_LIMIT', 'A quantidade de um item passou do disponível. Revise o pedido.')
      }
      if (quote.id !== body.quoteId) {
        return apiError(409, 'QUOTE_OUTDATED', 'Os valores do pedido mudaram. Revise e confirme novamente.')
      }

      const now = nowIso()
      const order: OrderRecord = {
        id: `ord-${crypto.randomUUID().slice(0, 8)}`,
        userId: user.id,
        status: 'pending',
        version: 1,
        createdAt: now,
        updatedAt: now,
        lines: quote.lines.map(({ lineId: _lineId, ...line }) => {
          const nft = db.nfts.find((item) => item.id === line.nftId)
          return { ...line, image: nft?.image ?? { src: '', alt: line.name, width: 1, height: 1, variants: [] } }
        }),
        subtotalEth: quote.subtotalEth,
        discountEth: quote.discountEth,
        networkFeeEth: quote.networkFeeEth,
        totalEth: quote.totalEth,
        couponCode: quote.coupon?.code ?? null,
        network: body.network,
        wallet: { id: wallet.id, label: wallet.label, provider: wallet.provider, address: wallet.address },
        buyer: { fullName: String(body.buyer?.fullName).trim(), email: String(body.buyer?.email).trim() },
        transaction: null,
        failureReason: null,
        settleAt: new Date(Date.now() + SETTLE_DELAY_MS).toISOString(),
        plannedOutcome: getActiveScenario() === 'pagamento-recusado' ? 'declined' : 'confirmed',
      }
      db.orders.push(order)
      db.idempotency[key] = { userId: user.id, requestHash, orderId: order.id }
      commit([{ type: 'order.updated', orderId: order.id }])
      scheduleSettlement(order)

      // "pedido-timeout": o pedido foi gravado, mas a 1ª resposta desta chave não chega a tempo.
      if (getActiveScenario() === 'pedido-timeout' && !timedOutKeys.has(key)) {
        timedOutKeys.add(key)
        await delay(env.httpTimeoutMs + 2000)
      }
      return HttpResponse.json(toOrderResponse(order), { status: 201 })
    }),
  ),

  http.get(
    api('/orders'),
    withNetwork('orders', ({ request }) => {
      const user = requireUser(request)
      settleDueOrders()
      const status = new URL(request.url).searchParams.get('status')
      const items = getDb()
        .orders.filter((order) => order.userId === user.id && (!status || order.status === status))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(toOrderResponse)
      return HttpResponse.json<OrderListResponse>({ items })
    }),
  ),

  http.get(
    api('/orders/:id'),
    withNetwork('orders', ({ request, params }) => {
      const user = requireUser(request)
      settleDueOrders()
      const order = getDb().orders.find((item) => item.id === params.id)
      if (!order) return apiError(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado.')
      if (order.userId !== user.id) return apiError(403, 'FORBIDDEN', 'Este pedido pertence a outra conta.')
      return HttpResponse.json(toOrderResponse(order))
    }),
  ),
]
