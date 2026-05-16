import { createMonitoringKpi } from '../domain/model/monitoring-kpi.entity.js'

export function toMonitoringKpiEntity(dto) {
  return createMonitoringKpi({
    ...dto,
    titleKey: `bounded.environmental.kpi.${dto.id}.title`,
  })
}
