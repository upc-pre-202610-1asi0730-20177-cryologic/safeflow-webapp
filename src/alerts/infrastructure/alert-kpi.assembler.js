import { createAlertKpi } from '../domain/model/alert-kpi.entity.js'

export function toAlertKpiEntity(dto) {
  return createAlertKpi({
    ...dto,
    titleKey: `bounded.alerts.kpi.${dto.id}.title`,
  })
}
