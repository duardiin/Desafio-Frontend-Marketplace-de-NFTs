import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { Socket } from 'socket.io-client'
import type { NftUpdatedEvent, OrderUpdatedEvent, SessionJoinPayload } from '@/api/contracts/events'
import { SESSION_JOIN } from '@/api/contracts/events'
import { env } from '@/config/env'
import { useSession } from '@/features/auth/session-query'
import { notify } from '@/features/feedback/notifications'
import { applyNftUpdated, applyOrderUpdated, SeenEvents } from '@/features/realtime/apply-events'
import { setRealtimeStatus } from '@/features/realtime/realtime-status'

/**
 * Conexão em tempo real (socket.io-client). Um socket por sessão: ao entrar,
 * sair ou trocar de usuário, o socket anterior e seus listeners são liberados
 * e outro é aberto, então eventos de uma sessão não chegam à seguinte.
 */
export function RealtimeProvider() {
  const queryClient = useQueryClient()
  const session = useSession()
  // Enquanto a sessão carrega, não conecta (evita abrir e fechar à toa).
  const ready = !session.isPending
  const token = session.data?.token ?? null
  const userId = session.data?.user.id ?? null

  useEffect(() => {
    if (!ready) return

    const seen = new SeenEvents()
    let wasConnected = false
    let lostNotified = false
    let socket: Socket | null = null
    let disposed = false

    // Import sob demanda: o engine.io-client guarda a referência ao WebSocket
    // global ao carregar o módulo. Carregado depois do bootstrap, ele usa o
    // WebSocket já interceptado pelo MSW. (Também tira a lib do bundle inicial.)
    void import('socket.io-client').then(({ io }) => {
      if (disposed) return
      socket = connect(io)
    })

    function connect(io: typeof import('socket.io-client').io): Socket {
    const socket = io(env.realtimeUrl, {
      path: '/socket.io',
      // O MSW intercepta WebSocket; o long-polling iria para a rede.
      transports: ['websocket'],
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
      // Servidor fora do ar: a tentativa falha em 3 s (padrão: 20 s) e a reconexão segue.
      timeout: 3000,
    })
    setRealtimeStatus('connecting')

    socket.on('connect', () => {
      socket.emit(SESSION_JOIN, { token } satisfies SessionJoinPayload)
      setRealtimeStatus('connected')
      if (wasConnected) {
        // Reconectou: eventos podem ter se perdido. Reconcilia com o REST.
        void queryClient.invalidateQueries({ queryKey: ['nfts'] })
        void queryClient.invalidateQueries({ queryKey: ['cart'] })
        if (userId) void queryClient.invalidateQueries({ queryKey: ['private', userId] })
        if (lostNotified) notify('Conexão em tempo real restabelecida. Os dados foram atualizados.', 'info')
      }
      wasConnected = true
      lostNotified = false
    })

    socket.on('disconnect', (reason) => {
      setRealtimeStatus('disconnected')
      if (reason !== 'io client disconnect' && !lostNotified) {
        lostNotified = true
        notify('Conexão em tempo real perdida. Tentando reconectar…', 'error')
      }
    })

    socket.on('nft.updated', (event: NftUpdatedEvent) => {
      if (seen.firstTime(event.id)) applyNftUpdated(queryClient, event)
    })

    socket.on('order.updated', (event: OrderUpdatedEvent) => {
      if (seen.firstTime(event.id)) applyOrderUpdated(queryClient, event, userId)
    })

    return socket
    }

    return () => {
      disposed = true
      socket?.removeAllListeners()
      socket?.disconnect()
    }
  }, [queryClient, ready, token, userId])

  return null
}
