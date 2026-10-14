import Decimal from 'decimal.js'
import type { Cart, Quote } from '@/api/contracts/cart'
import type { CartLineRecord, CartOwner, CartRecord, CouponRecord, MockDb, NftRecord } from '@/mocks/db/schema'
import { findEdition, lineIdOf, maxOrderable, toSummary } from '@/mocks/domain/catalog'
import { sumEth, toEth } from '@/mocks/lib/eth'
import { fnv1a } from '@/mocks/lib/hash'

/** Taxa de rede simulada por linha do pedido. */
const NETWORK_FEE_PER_LINE_ETH = '0.0021'

export function emptyCart(): CartRecord {
  return { lines: [], couponCode: null, version: 0 }
}

export function getCart(db: MockDb, owner: CartOwner): CartRecord {
  return db.carts[owner] ?? emptyCart()
}

export function saveCart(db: MockDb, owner: CartOwner, cart: CartRecord) {
  db.carts[owner] = { ...cart, version: cart.version + 1 }
}

/** Resolve NFT e edição de uma linha; linhas órfãs (NFT removido) são ignoradas. */
function resolveLine(db: MockDb, line: CartLineRecord) {
  const nft: NftRecord | undefined = db.nfts.find((item) => item.id === line.nftId)
  const edition = nft ? findEdition(nft, line.editionId) : undefined
  return nft && edition ? { nft, edition } : undefined
}

export function toCartResponse(db: MockDb, cart: CartRecord): Cart {
  return {
    couponCode: cart.couponCode,
    version: cart.version,
    items: cart.lines.flatMap((line) => {
      const resolved = resolveLine(db, line)
      if (!resolved) return []
      return [
        {
          lineId: lineIdOf(line.nftId, line.editionId),
          nft: toSummary(resolved.nft),
          edition: { ...resolved.edition },
          quantity: line.quantity,
          maxQuantity: maxOrderable(resolved.nft, resolved.edition),
          priceWhenAddedEth: line.priceWhenAddedEth,
        },
      ]
    }),
  }
}

export function findCoupon(db: MockDb, code: string): CouponRecord | undefined {
  return db.coupons.find((coupon) => coupon.code === code.trim().toUpperCase())
}

export function isCouponExpired(coupon: CouponRecord): boolean {
  return Date.parse(coupon.expiresAt) <= Date.now()
}

/**
 * Cotação calculada sempre com os preços e a disponibilidade atuais.
 * O `id` é derivado do conteúdo: qualquer mudança gera outro id.
 */
export function buildQuote(db: MockDb, cart: CartRecord): Quote {
  const lines = cart.lines.flatMap((line) => {
    const resolved = resolveLine(db, line)
    if (!resolved) return []
    const { nft, edition } = resolved
    return [
      {
        lineId: lineIdOf(nft.id, edition.id),
        nftId: nft.id,
        name: nft.name,
        editionId: edition.id,
        editionLabel: edition.label,
        unitPriceEth: nft.priceEth,
        quantity: line.quantity,
        lineTotalEth: toEth(new Decimal(nft.priceEth).times(line.quantity)),
        available: maxOrderable(nft, edition),
      },
    ]
  })

  const coupon = cart.couponCode ? findCoupon(db, cart.couponCode) : undefined
  const validCoupon = coupon && !isCouponExpired(coupon) ? coupon : undefined

  const subtotal = sumEth(lines.map((line) => line.lineTotalEth))
  const discount = validCoupon ? subtotal.times(validCoupon.percentOff).dividedBy(100) : new Decimal(0)
  const fee = new Decimal(NETWORK_FEE_PER_LINE_ETH).times(lines.length)
  const total = subtotal.minus(discount).plus(fee)

  const blockers = lines.flatMap((line): Quote['blockers'] => {
    if (line.available === 0) return [{ lineId: line.lineId, reason: 'EDITION_SOLD_OUT' }]
    if (line.quantity > line.available) return [{ lineId: line.lineId, reason: 'QUANTITY_LIMIT' }]
    return []
  })

  const quoteWithoutId: Omit<Quote, 'id'> = {
    lines: lines.map(({ available: _available, ...line }) => line),
    subtotalEth: toEth(subtotal),
    discountEth: toEth(discount),
    networkFeeEth: toEth(fee),
    totalEth: toEth(total),
    coupon: validCoupon ? { code: validCoupon.code, percentOff: validCoupon.percentOff } : null,
    blockers,
  }

  return { id: `q_${fnv1a(JSON.stringify(quoteWithoutId))}`, ...quoteWithoutId }
}
