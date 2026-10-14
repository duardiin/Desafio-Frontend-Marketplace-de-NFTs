import { setupWorker } from 'msw/browser'
import { handlers } from '@/mocks/handlers'
import { realtimeHandlers } from '@/mocks/realtime'

export const worker = setupWorker(...handlers, ...realtimeHandlers)
