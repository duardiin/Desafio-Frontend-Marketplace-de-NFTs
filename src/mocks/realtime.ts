import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import type {
  NftUpdatedEvent,
  OrderUpdatedEvent,
  RealtimeEvent,
  SessionJoinedPayload,
  SessionJoinPayload,
} from '@/api/contracts/events'
import { SESSION_JOIN, SESSION_JOINED } from '@/api/contracts/events'
import { env } from '@/config/env'
import type { DbChange } from '@/mocks/db/schema'
import { getDb, onDbChange } from '@/mocks/db/store'
import { toOrderResponse } from '@/mocks/domain/orders'
import { toEth } from '@/mocks/lib/eth'
import { userIdForToken } from '@/mocks/lib/http'

/**
 * Servidor Socket.IO simulado. O MSW intercepta o WebSocket do
 * `socket.io-client` (transporte "websocket") e o `@mswjs/socket.io-binding`
 * codifica/decodifica o protocolo. Os eventos nascem das mudanças do banco
 * simulado: o mesmo dado que o REST devolve.
 */

/** O binding simula o handshake com pingInterval de 25 s; sem pings o cliente cai em ~30 s. */
const HEARTBEAT_MS = 20_000
/** Engine.IO: pacote "ping" do servidor (o cliente responde "3"). */
const ENGINE_IO_PING = '2'

interface Connection {
  id: string
  userId: string | null
  io: ReturnType<typeof toSocketIo>
  close: () => void
}

const connections = new Map<string, Connection>()
let offlineUntil = 0
let lastEvent: { event: RealtimeEvent; userId: string | null } | null = null

/**
 * O MSW remove o prefixo "/socket.io/" do caminho e casa pela origem do
 * servidor (uso documentado do binding). Um host próprio evita capturar o
 * WebSocket do hot reload do Vite, que usa a origem do site.
 */
const realtime = ws.link(env.realtimeUrl)

export const realtimeHandlers = [
  realtime.addEventListener('connection', (connection) => {
    // "Queda de conexão" simulada: recusa novas conexões até o fim do período.
    if (Date.now() < offlineUntil) {
      queueMicrotask(() => connection.client.close(1001, 'offline'))
      return
    }

    const io = toSocketIo(connection)
    const entry: Connection = {
      id: crypto.randomUUID().slice(0, 8),
      userId: null,
      io,
      close: () => connection.client.close(1001, 'server shutdown'),
    }
    connections.set(entry.id, entry)

    const heartbeat = setInterval(() => connection.client.send(ENGINE_IO_PING), HEARTBEAT_MS)

    io.client.on(SESSION_JOIN, (_event, payload: SessionJoinPayload) => {
      // Só sessões válidas recebem eventos privados; token inválido = visitante.
      entry.userId = userIdForToken(payload?.token)
      io.client.emit(SESSION_JOINED, { userId: entry.userId } satisfies SessionJoinedPayload)
    })

    connection.client.addEventListener('close', () => {
      clearInterval(heartbeat)
      connections.delete(entry.id)
    })
  }),
]

function send(event: RealtimeEvent, userId: string | null) {
  lastEvent = { event, userId }
  for (const connection of connections.values()) {
    // Eventos privados (pedidos) só para as conexões do dono.
    if (userId && connection.userId !== userId) continue
    connection.io.client.emit(event.type, event)
  }
}

function nftEvent(nftId: string): NftUpdatedEvent | null {
  const nft = getDb().nfts.find((item) => item.id === nftId)
  if (!nft) return null
  return {
    id: `nft:${nft.id}:v${nft.version}`,
    type: 'nft.updated',
    resource: { type: 'nft', id: nft.id },
    version: nft.version,
    occurredAt: new Date().toISOString(),
    data: {
      id: nft.id,
      name: nft.name,
      priceEth: nft.priceEth,
      previousPriceEth: nft.previousPriceEth,
      editions: nft.editions.map((edition) => ({ ...edition })),
      soldOut: nft.soldOut,
      version: nft.version,
    },
  }
}

function orderEvent(orderId: string): OrderUpdatedEvent | null {
  const order = getDb().orders.find((item) => item.id === orderId)
  if (!order) return null
  return {
    id: `order:${order.id}:v${order.version}`,
    type: 'order.updated',
    resource: { type: 'order', id: order.id },
    version: order.version,
    occurredAt: new Date().toISOString(),
    userId: order.userId,
    data: toOrderResponse(order),
  }
}

/** Liga as mudanças do banco simulado aos eventos. */
export function startRealtimeEvents() {
  onDbChange((changes: DbChange[]) => {
    for (const change of changes) {
      if (change.type === 'nft.updated') {
        const event = nftEvent(change.nftId)
        if (event) send(event, null)
      } else if (change.type === 'order.updated') {
        const event = orderEvent(change.orderId)
        if (event) send(event, event.userId)
      }
    }
  })
}

/** Controles para demonstração e testes (sempre passam pelo socket). */
export const realtimeControls = {
  /** Reenvia o último evento, com o mesmo id (duplicata). */
  replayLast() {
    if (lastEvent) send(lastEvent.event, lastEvent.userId)
  },
  /** Envia um `nft.updated` com versão anterior à atual (evento atrasado). */
  emitStale(nftId: string, priceEth: string) {
    const event = nftEvent(nftId)
    if (!event) throw new Error(`NFT inexistente: ${nftId}`)
    const version = event.version - 1
    send(
      {
        ...event,
        id: `nft:${nftId}:v${version}`,
        version,
        data: { ...event.data, priceEth: toEth(priceEth), version },
      },
      null,
    )
  },
  /** Derruba as conexões e recusa reconexões por `ms` milissegundos. */
  goOffline(ms: number) {
    offlineUntil = Date.now() + ms
    for (const connection of connections.values()) connection.close()
  },
  /** Conexões ativas (para provar isolamento e liberação de listeners). */
  connections() {
    return [...connections.values()].map(({ id, userId }) => ({ id, userId }))
  },
}
