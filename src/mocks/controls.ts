import type { EthAmount } from '@/api/contracts/common'
import { commit, getDb, resetDb } from '@/mocks/db/store'
import { touchNft } from '@/mocks/domain/catalog'
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
  /**
   * Muda preço e/ou disponibilidade de um NFT, como faria o servidor.
   * `available` vale para a edição `editionId` ou, sem ela, para todas as edições limitadas.
   */
  updateNft(id: string, patch: { priceEth?: EthAmount; available?: number; editionId?: string }): void
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
        const targets = nft.editions.filter((edition) =>
          patch.editionId ? edition.id === patch.editionId : edition.supply !== null,
        )
        for (const edition of targets) {
          edition.available = Math.max(0, Math.min(edition.supply ?? Infinity, Math.trunc(patch.available)))
        }
      }
      touchNft(nft)
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
