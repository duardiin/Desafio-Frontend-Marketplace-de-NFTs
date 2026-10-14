import { http, HttpResponse } from 'msw'
import type {
  AddCartItemRequest,
  ApplyCouponRequest,
  MergeCartRequest,
  UpdateCartItemRequest,
} from '@/api/contracts/cart'
import { commit, getDb } from '@/mocks/db/store'
import type { CartOwner } from '@/mocks/db/schema'
import { maxOrderable } from '@/mocks/domain/catalog'
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
      if (!isPositiveInteger(body.quantity)) {
        return validationError({ quantity: ['A quantidade precisa ser um número inteiro maior que zero.'] })
      }

      const db = getDb()
      const nft = db.nfts.find((item) => item.id === body.nftId)
      if (!nft) return apiError(404, 'NFT_NOT_FOUND', 'Este NFT não existe ou foi removido.')

      const limit = maxOrderable(nft)
      if (limit === 0) return apiError(409, 'EDITION_SOLD_OUT', `"${nft.name}" está esgotado.`)

      const cart = getCart(db, owner)
      const existing = cart.lines.find((line) => line.nftId === nft.id)
      const quantity = (existing?.quantity ?? 0) + body.quantity
      if (quantity > limit) {
        return apiError(409, 'QUANTITY_LIMIT', `Você pode levar no máximo ${limit} de "${nft.name}".`)
      }

      const lines = existing
        ? cart.lines.map((line) => (line.nftId === nft.id ? { ...line, quantity } : line))
        : [...cart.lines, { nftId: nft.id, quantity, priceWhenAddedEth: nft.priceEth }]
      saveCart(db, owner, { ...cart, lines })
      commit()
      return cartResponse(owner)
    }),
  ),

  http.patch(
    api('/cart/items/:nftId'),
    withNetwork('cart', async ({ request, params }) => {
      const owner = requireOwner(request)
      const body = await readJson<UpdateCartItemRequest>(request)
      if (!isPositiveInteger(body.quantity)) {
        return validationError({ quantity: ['A quantidade precisa ser um número inteiro maior que zero.'] })
      }

      const db = getDb()
      const cart = getCart(db, owner)
      const line = cart.lines.find((item) => item.nftId === params.nftId)
      const nft = db.nfts.find((item) => item.id === params.nftId)
      if (!line || !nft) return apiError(404, 'CART_ITEM_NOT_FOUND', 'Este item não está mais no carrinho.')

      const limit = maxOrderable(nft)
      if (body.quantity > limit) {
        return limit === 0
          ? apiError(409, 'EDITION_SOLD_OUT', `"${nft.name}" está esgotado.`)
          : apiError(409, 'QUANTITY_LIMIT', `Você pode levar no máximo ${limit} de "${nft.name}".`)
      }

      const quantity = body.quantity
      saveCart(db, owner, {
        ...cart,
        lines: cart.lines.map((item) => (item.nftId === nft.id ? { ...item, quantity } : item)),
      })
      commit()
      return cartResponse(owner)
    }),
  ),

  http.delete(
    api('/cart/items/:nftId'),
    withNetwork('cart', ({ request, params }) => {
      const owner = requireOwner(request)
      const db = getDb()
      const cart = getCart(db, owner)
      if (!cart.lines.some((line) => line.nftId === params.nftId)) {
        return apiError(404, 'CART_ITEM_NOT_FOUND', 'Este item não está mais no carrinho.')
      }
      const lines = cart.lines.filter((line) => line.nftId !== params.nftId)
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
          if (!nft) continue
          const index = lines.findIndex((line) => line.nftId === guestLine.nftId)
          // Soma as quantidades respeitando o limite atual do NFT.
          const merged = Math.min(maxOrderable(nft), (lines[index]?.quantity ?? 0) + guestLine.quantity)
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
