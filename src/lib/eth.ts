import Decimal from 'decimal.js'
import type { EthAmount } from '@/api/contracts/common'

/**
 * Formata um valor ETH (string decimal) sem passar por `number`.
 * Mínimo de 2 casas, como no Figma ("1.19 ETH"); mantém as casas extras
 * de valores pequenos ("0.0021 ETH"). Ponto como separador, convenção do mercado.
 */
export function formatEth(value: EthAmount, { unit = true }: { unit?: boolean } = {}): string {
  const amount = new Decimal(value)
  const text = amount.toFixed(Math.max(2, amount.decimalPlaces()))
  return unit ? `${text} ETH` : text
}

/** Compara dois valores ETH com precisão decimal. */
export function sameEth(a: EthAmount, b: EthAmount): boolean {
  return new Decimal(a).equals(b)
}
