import { createAnalyticsShipmentRow } from '../domain/model/analytics-shipment-row.entity.js'

export function toAnalyticsShipmentRowEntity(dto) {
  return createAnalyticsShipmentRow({
    rowId: dto.id,
    trackingId: dto.trackingId,
    destination: dto.destination,
    carrier: dto.carrier,
    dateIso: dto.dateIso ?? null,
    status: dto.status,
  })
}
