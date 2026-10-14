import { useSyncExternalStore } from 'react'

export type NotificationTone = 'info' | 'success' | 'error'

export interface AppNotification {
  id: number
  message: string
  tone: NotificationTone
}

const AUTO_DISMISS_MS = 6000

let items: AppNotification[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

/**
 * Feedback de mutations e eventos (sessão, carrinho, tempo real).
 * Pode ser chamado fora do React (ex.: ao detectar sessão expirada no interceptor).
 */
export function notify(message: string, tone: NotificationTone = 'info') {
  const notification = { id: nextId++, message, tone }
  items = [...items.slice(-2), notification]
  emit()
  setTimeout(() => dismiss(notification.id), AUTO_DISMISS_MS)
}

export function dismiss(id: number) {
  items = items.filter((item) => item.id !== id)
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useNotifications(): AppNotification[] {
  return useSyncExternalStore(subscribe, () => items)
}
