import type { EditionOption } from '@/api/contracts/nfts'

/** Quanto pode ser pedido da edição: unidades disponíveis (aberta = sem limite) e limite por pedido. */
export function maxForEdition(edition: EditionOption | undefined, maxPerOrder: number): number {
  if (!edition) return 0
  return Math.max(0, Math.min(edition.available ?? Number.POSITIVE_INFINITY, maxPerOrder))
}

/** Edição inicial: a pedida na URL, se disponível; senão a primeira com unidades. */
export function initialEdition(editions: EditionOption[], requested: string | undefined): EditionOption | undefined {
  const fromUrl = editions.find((edition) => edition.id === requested)
  return fromUrl ?? editions.find((edition) => edition.available !== 0) ?? editions[0]
}

/** Texto de disponibilidade da edição, ex.: "4 de 10 disponíveis". */
export function availabilityText(edition: EditionOption): string {
  if (edition.available === null) return 'Edição aberta: sem limite de tiragem'
  if (edition.available === 0) return 'Edição esgotada'
  return `${edition.available} de ${edition.supply} ${edition.available === 1 ? 'disponível' : 'disponíveis'}`
}
