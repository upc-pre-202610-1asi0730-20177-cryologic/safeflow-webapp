import { createAnalyticsDeliveryMix } from '../domain/model/analytics-delivery-mix.entity.js'

export function toAnalyticsDeliveryMixEntity(dto) {
  return createAnalyticsDeliveryMix({
    deliveredPct: dto.deliveredPct,
    transitPct: dto.transitPct,
    pendingPct: dto.pendingPct,
    delayedPct: dto.delayedPct,
  })
}
