/**
 * Distribución porcentual de estados de entrega (dominio).
 * @param {object} p
 * @param {number} p.deliveredPct
 * @param {number} p.transitPct
 * @param {number} p.pendingPct
 * @param {number} p.delayedPct
 */
export function createAnalyticsDeliveryMix(p) {
  return Object.freeze({
    deliveredPct: p.deliveredPct,
    transitPct: p.transitPct,
    pendingPct: p.pendingPct,
    delayedPct: p.delayedPct,
  })
}
