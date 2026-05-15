import { createReportingStat } from '../domain/model/reporting-stat.entity.js'

export function toReportingStatEntity(dto) {
  return createReportingStat({
    id: dto.id,
    labelKey: `bounded.reporting.stats.${dto.id}.label`,
    valueKind: dto.valueKind,
    value: dto.value,
    textKey: dto.valueKind === 'text' ? `bounded.reporting.stats.${dto.id}.text` : undefined,
  })
}
