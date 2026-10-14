/**
 * Configuração versionada da auditoria Lighthouse (enunciado, seção 10).
 *
 * - Build otimizado (`vite build`) servido pelo `vite preview`, com o cenário
 *   padrão dos mocks (MSW e Socket.IO simulado ativos, como na entrega).
 * - Páginas: Início e Detalhe do NFT. Perfis: mobile e desktop (presets do Lighthouse).
 * - 3 medições por página e perfil; o relatório usa a mediana de cada categoria.
 * - Cada medição abre um Chrome novo e o Lighthouse limpa o armazenamento antes
 *   de carregar: é sempre a primeira visita (banco simulado novo, sem cache).
 */
export const PREVIEW_PORT = 4180

export const PAGES = [
  { id: 'inicio', name: 'Início', path: '/' },
  { id: 'detalhe', name: 'Detalhe do NFT', path: '/nft/nft-001' },
]

/** `mobile`: preset padrão (Moto G Power, 4G lento simulado, CPU 4×). `desktop`: preset de desktop do Lighthouse. */
export const FORM_FACTORS = ['mobile', 'desktop']

export const RUNS = 3

export const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']

/** Metas do enunciado (pontuação de 0 a 100). */
export const TARGETS = {
  performance: 90,
  accessibility: 95,
  'best-practices': 95,
  seo: 90,
}

/** Métricas registradas (enunciado: LCP, CLS e TBT). */
export const METRICS = [
  { id: 'largest-contentful-paint', label: 'LCP', unit: 'ms' },
  { id: 'cumulative-layout-shift', label: 'CLS', unit: '' },
  { id: 'total-blocking-time', label: 'TBT', unit: 'ms' },
]
