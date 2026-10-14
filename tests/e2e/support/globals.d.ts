/**
 * Controles da API simulada expostos pelo app (src/mocks/controls.ts).
 * Repetidos aqui porque o projeto de testes não inclui o código do app.
 */
interface KurioMockControlsForTests {
  getScenario(): string
  setScenario(name: string): void
  reset(): void
  updateNft(id: string, patch: { priceEth?: string; available?: number; editionId?: string }): void
  expireSessions(): void
  realtime: {
    replayLast(): void
    emitStale(nftId: string, priceEth: string): void
    goOffline(ms: number): void
    connections(): { id: string; userId: string | null }[]
  }
}

interface Window {
  __kurioMock?: KurioMockControlsForTests
}
