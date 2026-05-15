import { createAnalyticsFleetUnit } from '../domain/model/analytics-fleet-unit.entity.js'

export function toAnalyticsFleetUnitEntity(dto) {
  return createAnalyticsFleetUnit({
    rowId: dto.id,
    nameLoc: dto.nameLoc,
    vehicleCode: dto.vehicleCode,
    progress: dto.progress,
    status: dto.status,
  })
}
