import type { Order } from '@/api/contracts/orders'
import type { DbChange, MockDb, OrderRecord } from '@/mocks/db/schema'
import { commit, getDb } from '@/mocks/db/store'
import { getCart, saveCart } from '@/mocks/domain/cart'
import { findEdition, touchNft } from '@/mocks/domain/catalog'
import { longHash } from '@/mocks/lib/hash'
import { nowIso } from '@/mocks/lib/http'

/** Tempo até a simulação de pagamento resolver um pedido pendente. */
export const SETTLE_DELAY_MS = 2500

export function toOrderResponse(order: OrderRecord): Order {
  const { userId: _userId, settleAt: _settleAt, plannedOutcome: _plannedOutcome, ...publicOrder } = order
  return publicOrder
}

function confirm(db: MockDb, order: OrderRecord, changes: DbChange[]) {
  // Revalida a disponibilidade no momento da liquidação.
  const shortage = order.lines.find((line) => {
    const nft = db.nfts.find((item) => item.id === line.nftId)
    const edition = nft && findEdition(nft, line.editionId)
    return !edition || (edition.available !== null && edition.available < line.quantity)
  })
  if (shortage) {
    decline(order, `A edição ${shortage.editionLabel} de "${shortage.name}" esgotou antes da confirmação.`)
    return
  }

  for (const line of order.lines) {
    const nft = db.nfts.find((item) => item.id === line.nftId)
    const edition = nft && findEdition(nft, line.editionId)
    if (!nft || !edition) continue
    // Edição aberta não tem estoque a baixar, mas a versão muda (nova venda).
    if (edition.available !== null) edition.available -= line.quantity
    touchNft(nft)
    changes.push({ type: 'nft.updated', nftId: nft.id })
  }

  // Remove do carrinho apenas o que foi comprado.
  const owner = `user:${order.userId}` as const
  const cart = getCart(db, owner)
  const lines = cart.lines
    .map((line) => {
      const bought =
        order.lines.find((item) => item.nftId === line.nftId && item.editionId === line.editionId)?.quantity ?? 0
      return { ...line, quantity: line.quantity - bought }
    })
    .filter((line) => line.quantity > 0)
  saveCart(db, owner, { ...cart, lines, couponCode: lines.length > 0 ? cart.couponCode : null })

  const hash = `0x${longHash(order.id, 8)}`
  order.status = 'confirmed'
  order.transaction = { hash, explorerUrl: `/transacoes/${hash}` }
}

function decline(order: OrderRecord, reason: string) {
  order.status = 'declined'
  order.failureReason = reason
}

/** Resolve os pedidos pendentes cujo prazo de liquidação já passou. */
export function settleDueOrders() {
  const db = getDb()
  const changes: DbChange[] = []

  for (const order of db.orders) {
    if (order.status !== 'pending' || Date.parse(order.settleAt) > Date.now()) continue

    if (order.plannedOutcome === 'declined') {
      decline(order, 'Pagamento recusado pela carteira.')
    } else {
      confirm(db, order, changes)
    }
    order.version += 1
    order.updatedAt = nowIso()
    changes.push({ type: 'order.updated', orderId: order.id })
  }

  if (changes.length > 0) commit(changes)
}

/** Agenda a liquidação; pedidos pendentes também são resolvidos ao consultar (sobrevive a refresh). */
export function scheduleSettlement(order: OrderRecord) {
  const wait = Math.max(0, Date.parse(order.settleAt) - Date.now())
  setTimeout(settleDueOrders, wait + 10)
}

export function resumePendingOrders() {
  settleDueOrders()
  getDb()
    .orders.filter((order) => order.status === 'pending')
    .forEach(scheduleSettlement)
}
