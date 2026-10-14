import type { CouponRecord } from '@/mocks/db/schema'

/**
 * Cupons determinísticos (códigos sem diferenciar maiúsculas):
 * - KURIO10: 10% de desconto, válido
 * - EXPIRADO: vencido (422 COUPON_EXPIRED)
 * - qualquer outro: inexistente (422 COUPON_INVALID)
 */
export function createCouponFixtures(): CouponRecord[] {
  return [
    { code: 'KURIO10', percentOff: 10, expiresAt: '2099-12-31T23:59:59.000Z' },
    { code: 'EXPIRADO', percentOff: 15, expiresAt: '2025-01-01T00:00:00.000Z' },
  ]
}
