import { http, HttpResponse } from 'msw'
import type {
  ChangePasswordRequest,
  Profile,
  UpdateAvatarRequest,
  UpdateProfileRequest,
} from '@/api/contracts/profile'
import type {
  CreateWalletRequest,
  UpdateWalletRequest,
  Wallet,
  WalletListResponse,
} from '@/api/contracts/wallets'
import { commit, getDb } from '@/mocks/db/store'
import type { UserRecord, WalletRecord } from '@/mocks/db/schema'
import { api } from '@/mocks/handlers/paths'
import { hashPassword, randomSalt } from '@/mocks/lib/hash'
import { apiError, readJson, requireUser, validationError } from '@/mocks/lib/http'
import {
  isWalletProvider,
  validateBio,
  validateDisplayName,
  validateEmail,
  validateNewPassword,
  validateUsername,
  validateWalletAddress,
  validateWalletNetworks,
} from '@/mocks/lib/validation'
import { withNetwork } from '@/mocks/network'

const AVATAR_MAX_BYTES = 300 * 1024
const AVATAR_PATTERN = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/

function toProfile(user: UserRecord): Profile {
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
  }
}

function toWallet(record: WalletRecord): Wallet {
  const { userId: _userId, ...wallet } = record
  return wallet
}

function walletList(userId: string) {
  const items = getDb()
    .wallets.filter((wallet) => wallet.userId === userId)
    .sort((a, b) => (a.role === 'principal' ? -1 : 1) - (b.role === 'principal' ? -1 : 1))
    .map(toWallet)
  return HttpResponse.json<WalletListResponse>({ items })
}

export const accountHandlers = [
  http.get(
    api('/me/profile'),
    withNetwork('profile', ({ request }) => HttpResponse.json(toProfile(requireUser(request)))),
  ),

  http.patch(
    api('/me/profile'),
    withNetwork('profile', async ({ request }) => {
      const user = requireUser(request)
      const body = await readJson<UpdateProfileRequest>(request)
      const fieldErrors = {
        ...(body.displayName !== undefined ? validateDisplayName(body.displayName) : {}),
        ...(body.username !== undefined ? validateUsername(body.username) : {}),
        ...(body.email !== undefined ? validateEmail(body.email) : {}),
        ...(body.bio !== undefined ? validateBio(body.bio) : {}),
      }
      if (Object.keys(fieldErrors).length > 0) return validationError(fieldErrors)

      const db = getDb()
      const email = body.email?.trim().toLowerCase()
      if (email && db.users.some((item) => item.email === email && item.id !== user.id)) {
        return apiError(409, 'EMAIL_TAKEN', 'Este e-mail já está em uso.', {
          email: ['Este e-mail já está em uso por outra conta.'],
        })
      }
      const username = body.username?.trim()
      if (username && db.users.some((item) => item.username === username && item.id !== user.id)) {
        return validationError({ username: ['Este nome de usuário já está em uso.'] })
      }

      if (body.displayName !== undefined) user.displayName = body.displayName.trim()
      if (username) user.username = username
      if (email) user.email = email
      if (body.bio !== undefined) user.bio = body.bio
      commit()
      return HttpResponse.json(toProfile(user))
    }),
  ),

  http.put(
    api('/me/avatar'),
    withNetwork('profile', async ({ request }) => {
      const user = requireUser(request)
      const body = await readJson<UpdateAvatarRequest>(request)
      const dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl : ''
      if (!AVATAR_PATTERN.test(dataUrl)) {
        return validationError({ avatar: ['Envie uma imagem PNG, JPEG ou WebP.'] })
      }
      const approximateBytes = Math.floor((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75)
      if (approximateBytes > AVATAR_MAX_BYTES) {
        return validationError({ avatar: ['A imagem precisa ter no máximo 300 KB.'] })
      }
      user.avatarUrl = dataUrl
      commit()
      return HttpResponse.json(toProfile(user))
    }),
  ),

  http.post(
    api('/me/password'),
    withNetwork('profile', async ({ request }) => {
      const user = requireUser(request)
      const body = await readJson<ChangePasswordRequest>(request)
      const currentHash = await hashPassword(String(body.currentPassword ?? ''), user.passwordSalt)
      if (currentHash !== user.passwordHash) {
        return apiError(422, 'WRONG_PASSWORD', 'A senha atual está incorreta.', {
          currentPassword: ['A senha atual está incorreta.'],
        })
      }
      const fieldErrors = validateNewPassword(body.newPassword)
      if (body.newPassword === body.currentPassword) {
        fieldErrors.newPassword = ['A nova senha precisa ser diferente da atual.']
      }
      if (Object.keys(fieldErrors).length > 0) return validationError(fieldErrors)

      user.passwordSalt = randomSalt()
      user.passwordHash = await hashPassword(String(body.newPassword), user.passwordSalt)
      commit()
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.get(
    api('/me/wallets'),
    withNetwork('wallets', ({ request }) => walletList(requireUser(request).id)),
  ),

  http.post(
    api('/me/wallets'),
    withNetwork('wallets', async ({ request }) => {
      const user = requireUser(request)
      const body = await readJson<CreateWalletRequest>(request)
      const fieldErrors = {
        ...validateDisplayName(body.label, 'label'),
        ...(isWalletProvider(body.provider) ? {} : { provider: ['Selecione o provedor da carteira.'] }),
        ...validateWalletNetworks(body.networks),
        ...validateWalletAddress(body.address, body.networks),
        ...(body.role === 'principal' || body.role === 'secundaria' ? {} : { role: ['Escolha principal ou secundária.'] }),
      }
      if (Object.keys(fieldErrors).length > 0) return validationError(fieldErrors)

      const db = getDb()
      const own = db.wallets.filter((wallet) => wallet.userId === user.id)
      if (own.length >= 2 || own.some((wallet) => wallet.role === body.role)) {
        return apiError(409, 'WALLET_LIMIT', `Você já tem uma carteira ${body.role === 'principal' ? 'principal' : 'secundária'}. Edite a existente.`)
      }

      const record: WalletRecord = {
        id: `wal-${crypto.randomUUID().slice(0, 8)}`,
        userId: user.id,
        label: String(body.label).trim(),
        provider: body.provider as WalletRecord['provider'],
        address: String(body.address).trim(),
        networks: body.networks as WalletRecord['networks'],
        role: body.role as WalletRecord['role'],
      }
      db.wallets.push(record)
      commit()
      return HttpResponse.json(toWallet(record), { status: 201 })
    }),
  ),

  http.patch(
    api('/me/wallets/:id'),
    withNetwork('wallets', async ({ request, params }) => {
      const user = requireUser(request)
      const db = getDb()
      const wallet = db.wallets.find((item) => item.id === params.id)
      if (!wallet) return apiError(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada.')
      if (wallet.userId !== user.id) return apiError(403, 'FORBIDDEN', 'Esta carteira pertence a outra conta.')

      const body = await readJson<UpdateWalletRequest>(request)
      const next = { ...wallet, ...body }
      const fieldErrors = {
        ...validateDisplayName(next.label, 'label'),
        ...(isWalletProvider(next.provider) ? {} : { provider: ['Selecione o provedor da carteira.'] }),
        ...validateWalletNetworks(next.networks),
        ...validateWalletAddress(next.address, next.networks),
        ...(next.role === 'principal' || next.role === 'secundaria' ? {} : { role: ['Escolha principal ou secundária.'] }),
      }
      if (Object.keys(fieldErrors).length > 0) return validationError(fieldErrors)

      // Trocar o papel rebaixa/promove a outra carteira do usuário.
      if (next.role !== wallet.role) {
        const other = db.wallets.find((item) => item.userId === user.id && item.id !== wallet.id)
        if (other) other.role = wallet.role
      }
      Object.assign(wallet, {
        label: next.label.trim(),
        provider: next.provider,
        address: next.address.trim(),
        networks: next.networks,
        role: next.role,
      })
      commit()
      return walletList(user.id)
    }),
  ),
]
