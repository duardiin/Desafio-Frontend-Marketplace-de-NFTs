import type { DbChange, MockDb } from '@/mocks/db/schema'
import { createCouponFixtures } from '@/mocks/fixtures/coupons'
import { createNftFixtures } from '@/mocks/fixtures/nfts'
import {
  createCartFixtures,
  createFavoriteFixtures,
  createUserFixtures,
  createWalletFixtures,
} from '@/mocks/fixtures/users'

const STORAGE_KEY = 'kurio:mock-db'
/** Aumente ao mudar o formato do banco: estados antigos são descartados. */
const SCHEMA_VERSION = 5

type Listener = (changes: DbChange[]) => void

let db: MockDb | undefined
const listeners = new Set<Listener>()

/** Estado conhecido e completo do cenário inicial. */
export function createSeedDb(): MockDb {
  return {
    schemaVersion: SCHEMA_VERSION,
    users: createUserFixtures(),
    sessions: [],
    nfts: createNftFixtures(),
    favorites: createFavoriteFixtures(),
    carts: createCartFixtures(),
    wallets: createWalletFixtures(),
    orders: [],
    idempotency: {},
    walletConnections: [],
    coupons: createCouponFixtures(),
  }
}

function load(): MockDb | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as MockDb
    return parsed.schemaVersion === SCHEMA_VERSION ? parsed : undefined
  } catch {
    return undefined
  }
}

function save(current: MockDb) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  } catch {
    // Sem storage (modo privado, cota): o banco segue em memória até o refresh.
  }
}

export function getDb(): MockDb {
  if (!db) {
    db = load() ?? createSeedDb()
    save(db)
  }
  return db
}

/** Persiste o estado e avisa os interessados (eventos em tempo real). */
export function commit(changes: DbChange[] = []) {
  save(getDb())
  if (changes.length > 0) listeners.forEach((listener) => listener(changes))
}

/** Restaura integralmente o cenário inicial. */
export function resetDb() {
  db = createSeedDb()
  save(db)
  listeners.forEach((listener) => listener([{ type: 'reset' }]))
}

export function onDbChange(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
