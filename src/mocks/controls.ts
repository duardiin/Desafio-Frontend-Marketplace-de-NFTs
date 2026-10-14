import type { EthAmount } from '@/api/contracts/common'
import { commit, getDb, resetDb } from '@/mocks/db/store'
import { toEth } from '@/mocks/lib/eth'
import {
  getActiveScenario,
  isScenarioName,
  SCENARIOS,
  setActiveScenario,
  type ScenarioName,
} from '@/mocks/scenarios'

/**
 * Controles da API simulada, expostos em `window.__kurioMock` só quando os
 * mocks estão ativos. Servem para demonstração e para os testes E2E
 * dispararem mudanças "do servidor" (que refletem no REST e, no bloco de
 * tempo real, nos eventos Socket.IO). A UI nunca usa estes controles.
 */
export interface KurioMockControls {
  scenarios: typeof SCENARIOS
  getScenario(): ScenarioName
  /** Troca o cenário (vale após recarregar a página). */
  setScenario(name: string): void
  /** Restaura integralmente o cenário inicial (dados das fixtures). */
  reset(): void
  /** Muda preço e/ou disponibilidade de um NFT, como faria o servidor. */
  updateNft(id: string, patch: { priceEth?: EthAmount; available?: number }): void
  /** Expira todas as sessões ativas. */
  expireSessions(): void
}

declare global {
  interface Window {
    __kurioMock?: KurioMockControls
  }
}

export function exposeMockControls() {
  window.__kurioMock = {
    scenarios: SCENARIOS,
    getScenario: getActiveScenario,
    setScenario(name) {
      if (!isScenarioName(name)) throw new Error(`Cenário desconhecido: ${name}`)
      setActiveScenario(name)
    },
    reset: resetDb,
    updateNft(id, patch) {
      const nft = getDb().nfts.find((item) => item.id === id)
      if (!nft) throw new Error(`NFT inexistente: ${id}`)
      if (patch.priceEth !== undefined) nft.priceEth = toEth(patch.priceEth)
      if (patch.available !== undefined) {
        nft.editions.available = Math.max(0, Math.min(nft.editions.total, Math.trunc(patch.available)))
      }
      nft.version += 1
      commit([{ type: 'nft.updated', nftId: id }])
    },
    expireSessions() {
      const db = getDb()
      const past = new Date(Date.now() - 1000).toISOString()
      db.sessions = db.sessions.map((session) => ({ ...session, expiresAt: past }))
      commit()
    },
  }
}
