import { http, HttpResponse } from 'msw'
import type {
  AddCartItemRequest,
  ApplyCouponRequest,
  MergeCartRequest,
  UpdateCartItemRequest,
} from '@/api/contracts/cart'
import { commit, getDb } from '@/mocks/db/store'
import type { CartLineRecord, CartOwner, MockDb } from '@/mocks/db/schema'
import { findEdition, lineIdOf, maxOrderable } from '@/mocks/domain/catalog'
import {
  buildQuote,
  emptyCart,
  findCoupon,
  getCart,
  isCouponExpired,
  saveCart,
  toCartResponse,
} from '@/mocks/domain/cart'
import { api } from '@/mocks/handlers/paths'
import { apiError, cartOwner, readJson, requireUser, validationError } from '@/mocks/lib/http'
import { withNetwork } from '@/mocks/network'

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function cartResponse(owner: CartOwner) {
  const db = getDb()
  return HttpResponse.json(toCartResponse(db, getCart(db, owner)))
}

/** Dono obrigatório para mutations: sem sessão nem X-Guest-Id não há carrinho. */
function requireOwner(request: Request): CartOwner {
  const owner = cartOwner(request)
  if (!owner) throw apiError(400, 'VALIDATION_FAILED', 'Carrinho não identificado.')
  return owner
}

function findLine(lines: CartLineRecord[], lineId: unknown) {
  return lines.find((line) => lineIdOf(line.nftId, line.editionId) === lineId)
}

/** NFT + edição da linha, ou a resposta de erro adequada. */
function resolveTarget(db: MockDb, nftId: unknown, editionId: unknown) {
  const nft = db.nfts.find((item) => item.id === nftId)
  if (!nft) throw apiError(404, 'NFT_NOT_FOUND', 'Este NFT não existe ou foi removido.')
  const edition = findEdition(nft, String(editionId ?? ''))
  if (!edition) throw validationError({ editionId: ['Escolha uma edição disponível.'] })
  return { nft, edition }
}

function limitError(name: string, editionLabel: string, limit: number) {
  return limit === 0
    ? apiError(409, 'EDITION_SOLD_OUT', `A edição ${editionLabel} de "${name}" está esgotada.`)
    : apiError(409, 'QUANTITY_LIMIT', `Você pode levar no máximo ${limit} da edição ${editionLabel} de "${name}".`)
}

const QUANTITY_ERROR = { quantity: ['A quantidade precisa ser um número inteiro maior que zero.'] }

export const cartHandlers = [
  http.get(
    api('/cart'),
    withNetwork('cart', ({ request }) => {
      const owner = cartOwner(request)
      if (!owner) return HttpResponse.json(toCartResponse(getDb(), emptyCart()))
      return cartResponse(owner)
    }),
  ),

  http.post(
    api('/cart/items'),
    withNetwork('cart', async ({ request }) => {
      const owner = requireOwner(request)
      const body = await readJson<AddCartItemRequest>(request)
      if (!isPositiveInteger(body.quantity)) return validationError(QUANTITY_ERROR)

      const db = getDb()
      const { nft, edition } = resolveTarget(db, body.nftId, body.editionId)
      const limit = maxOrderable(nft, edition)
      const cart = getCart(db, owner)
      const existing = cart.lines.find((line) => line.nftId === nft.id && line.editionId === edition.id)
      const quantity = (existing?.quantity ?? 0) + body.quantity
      if (quantity > limit) return limitError(nft.name, edition.label, limit)

      const lines = existing
        ? cart.lines.map((line) => (line === existing ? { ...line, quantity } : line))
        : [...cart.lines, { nftId: nft.id, editionId: edition.id, quantity, priceWhenAddedEth: nft.priceEth }]
      saveCart(db, owner, { ...cart, lines })
      commit()
      return cartResponse(owner)
    }),
  ),

  http.patch(
    api('/cart/items/:lineId'),
    withNetwork('cart', async ({ request, params }) => {
      const owner = requireOwner(request)
      const body = await readJson<UpdateCartItemRequest>(request)
      if (!isPositiveInteger(body.quantity)) return validationError(QUANTITY_ERROR)

      const db = getDb()
      const cart = getCart(db, owner)
      const line = findLine(cart.lines, params.lineId)
      if (!line) return apiError(404, 'CART_ITEM_NOT_FOUND', 'Este item não está mais no carrinho.')

      const { nft, edition } = resolveTarget(db, line.nftId, line.editionId)
      const limit = maxOrderable(nft, edition)
      if (body.quantity > limit) return limitError(nft.name, edition.label, limit)

      const quantity = body.quantity
      saveCart(db, owner, {
        ...cart,
        lines: cart.lines.map((item) => (item === line ? { ...item, quantity } : item)),
      })
      commit()
      return cartResponse(owner)
    }),
  ),

  http.delete(
    api('/cart/items/:lineId'),
    withNetwork('cart', ({ request, params }) => {
      const owner = requireOwner(request)
      const db = getDb()
      const cart = getCart(db, owner)
      const line = findLine(cart.lines, params.lineId)
      if (!line) return apiError(404, 'CART_ITEM_NOT_FOUND', 'Este item não está mais no carrinho.')

      const lines = cart.lines.filter((item) => item !== line)
      saveCart(db, owner, { ...cart, lines, couponCode: lines.length > 0 ? cart.couponCode : null })
      commit()
      return cartResponse(owner)
    }),
  ),

  http.put(
    api('/cart/coupon'),
    withNetwork('cart', async ({ request }) => {
      const owner = requireOwner(request)
      const body = await readJson<ApplyCouponRequest>(request)
      const db = getDb()
      const coupon = findCoupon(db, String(body.code ?? ''))

      if (!coupon) {
        return apiError(422, 'COUPON_INVALID', 'Cupom inválido.', { code: ['Cupom inválido. Confira o código.'] })
      }
      if (isCouponExpired(coupon)) {
        return apiError(422, 'COUPON_EXPIRED', 'Este cupom expirou.', { code: ['Este cupom expirou.'] })
      }

      const cart = getCart(db, owner)
      if (cart.lines.length === 0) {
        return validationError({ code: ['Adicione itens ao carrinho antes de aplicar um cupom.'] })
      }
      saveCart(db, owner, { ...cart, couponCode: coupon.code })
      commit()
      return cartResponse(owner)
    }),
  ),

  http.delete(
    api('/cart/coupon'),
    withNetwork('cart', ({ request }) => {
      const owner = requireOwner(request)
      const db = getDb()
      saveCart(db, owner, { ...getCart(db, owner), couponCode: null })
      commit()
      return cartResponse(owner)
    }),
  ),

  http.post(
    api('/cart/merge'),
    withNetwork('cart', async ({ request }) => {
      const user = requireUser(request)
      const body = await readJson<MergeCartRequest>(request)
      const guestOwner = `guest:${String(body.guestId ?? '')}` as const
      const userOwner = `user:${user.id}` as const
      const db = getDb()
      const guestCart = db.carts[guestOwner]

      if (guestCart && guestCart.lines.length > 0) {
        const userCart = getCart(db, userOwner)
        const lines = [...userCart.lines]
        for (const guestLine of guestCart.lines) {
          const nft = db.nfts.find((item) => item.id === guestLine.nftId)
          const edition = nft && findEdition(nft, guestLine.editionId)
          if (!nft || !edition) continue
          const index = lines.findIndex(
            (line) => line.nftId === guestLine.nftId && line.editionId === guestLine.editionId,
          )
          // Soma as quantidades respeitando o limite atual da edição.
          const merged = Math.min(maxOrderable(nft, edition), (lines[index]?.quantity ?? 0) + guestLine.quantity)
          if (merged <= 0) continue
          if (index >= 0) lines[index] = { ...lines[index], quantity: merged }
          else lines.push({ ...guestLine, quantity: merged })
        }
        saveCart(db, userOwner, { ...userCart, lines, couponCode: userCart.couponCode ?? guestCart.couponCode })
        delete db.carts[guestOwner]
        commit()
      }
      return cartResponse(userOwner)
    }),
  ),

  http.get(
    api('/cart/quote'),
    withNetwork('quote', ({ request }) => {
      const owner = cartOwner(request)
      const db = getDb()
      return HttpResponse.json(buildQuote(db, owner ? getCart(db, owner) : emptyCart()))
    }),
  ),
]
