import { createAnalyticsKpi } from '../domain/model/analytics-kpi.entity.js'

export function toAnalyticsKpiEntity(dto) {
  return createAnalyticsKpi({
    ...dto,
    titleKey: `bounded.analytics.kpi.${dto.id}.title`,
  })
}
