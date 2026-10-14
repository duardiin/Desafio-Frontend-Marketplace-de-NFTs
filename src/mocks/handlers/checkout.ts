import { http, HttpResponse } from 'msw'
import type { WalletConnection, WalletConnectionRequest } from '@/api/contracts/checkout'
import { commit, getDb } from '@/mocks/db/store'
import { api } from '@/mocks/handlers/paths'
import { apiError, readJson, requireUser } from '@/mocks/lib/http'
import { isNetwork } from '@/mocks/lib/validation'
import { withNetwork } from '@/mocks/network'
import { getActiveScenario } from '@/mocks/scenarios'

/** Validade de uma conexão simulada com a carteira. */
const CONNECTION_TTL_MS = 10 * 60 * 1000
/** Tempo que a "extensão da carteira" leva para responder. */
const WALLET_PROMPT_MS = 600

export const checkoutHandlers = [
  http.post(
    api('/checkout/wallet-connection'),
    withNetwork('checkout', async ({ request }) => {
      const user = requireUser(request)
      const body = await readJson<WalletConnectionRequest>(request)
      const db = getDb()
      const wallet = db.wallets.find((item) => item.id === body.walletId)

      if (!wallet) return apiError(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada.')
      if (wallet.userId !== user.id) return apiError(403, 'FORBIDDEN', 'Esta carteira não pertence à sua conta.')
      if (!isNetwork(body.network) || !wallet.networks.includes(body.network)) {
        return apiError(409, 'WALLET_NETWORK_MISMATCH', 'A carteira escolhida não opera nesta rede.')
      }

      await new Promise((resolve) => setTimeout(resolve, WALLET_PROMPT_MS))
      if (getActiveScenario() === 'carteira-recusada') {
        return apiError(409, 'WALLET_REJECTED', 'A conexão foi recusada na carteira.')
      }

      const connection = {
        id: `con-${crypto.randomUUID().slice(0, 8)}`,
        userId: user.id,
        walletId: wallet.id,
        network: body.network,
        expiresAt: new Date(Date.now() + CONNECTION_TTL_MS).toISOString(),
      }
      // Uma conexão ativa por usuário.
      db.walletConnections = [...db.walletConnections.filter((item) => item.userId !== user.id), connection]
      commit()
      return HttpResponse.json<WalletConnection>(
        {
          id: connection.id,
          walletId: wallet.id,
          network: connection.network,
          address: wallet.address,
          expiresAt: connection.expiresAt,
        },
        { status: 201 },
      )
    }),
  ),

  http.delete(
    api('/checkout/wallet-connection/:id'),
    withNetwork('checkout', ({ request, params }) => {
      const user = requireUser(request)
      const db = getDb()
      db.walletConnections = db.walletConnections.filter(
        (item) => !(item.id === params.id && item.userId === user.id),
      )
      commit()
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
