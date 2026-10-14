/**
 * Valor em ETH como string decimal (ex.: "1.19", "0.0021").
 * Nunca converter para `number`: cálculos usam decimal.js.
 */
export type EthAmount = string

/** Data/hora em ISO 8601 (UTC). */
export type IsoDateTime = string

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export const NETWORKS = ['ethereum', 'polygon', 'solana'] as const
export type Network = (typeof NETWORKS)[number]

export const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export interface ImageAsset {
  /** Variante padrão (512 px). */
  src: string
  alt: string
  /** Dimensões intrínsecas (proporção), para reservar espaço sem deslocar o layout. */
  width: number
  height: number
  /** Variantes responsivas para `srcset`. */
  variants: { width: number; src: string }[]
}
