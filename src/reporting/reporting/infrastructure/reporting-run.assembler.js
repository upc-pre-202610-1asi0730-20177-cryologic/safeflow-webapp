import { createReportingRun } from '../domain/model/reporting-run.entity.js'

export function toReportingRunEntity(dto) {
  const base = `bounded.reporting.runs.${dto.id}`
  return createReportingRun({
    rowId: dto.id,
    titleKey: `${base}.title`,
    generatedKey: `${base}.generated`,
    format: dto.format,
    status: dto.status,
  })
}
