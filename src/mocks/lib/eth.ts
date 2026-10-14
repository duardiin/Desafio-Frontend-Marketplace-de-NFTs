import Decimal from 'decimal.js'
import type { EthAmount } from '@/api/contracts/common'

/** Casas decimais usadas nas respostas da API simulada. */
const ETH_DECIMALS = 6

export function toEth(value: Decimal.Value): EthAmount {
  return new Decimal(value).toDecimalPlaces(ETH_DECIMALS, Decimal.ROUND_HALF_UP).toFixed()
}

export function sumEth(values: Decimal.Value[]): Decimal {
  return values.reduce<Decimal>((acc, value) => acc.plus(value), new Decimal(0))
}

export function compareEth(a: Decimal.Value, b: Decimal.Value): number {
  return new Decimal(a).comparedTo(b)
}
