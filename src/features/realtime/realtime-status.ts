import { useSyncExternalStore } from 'react'

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected'

let status: RealtimeStatus = 'connecting'
const listeners = new Set<() => void>()

export function setRealtimeStatus(next: RealtimeStatus) {
  if (next === status) return
  status = next
  listeners.forEach((listener) => listener())
}

export function getRealtimeStatus(): RealtimeStatus {
  return status
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Estado da conexão em tempo real (para a interface reagir a quedas). */
export function useRealtimeStatus(): RealtimeStatus {
  return useSyncExternalStore(subscribe, getRealtimeStatus)
}
