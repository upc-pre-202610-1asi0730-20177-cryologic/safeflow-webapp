import { createMonitoringCard } from '../domain/model/monitoring-card.entity.js'

export function toMonitoringCardEntity(dto) {
  const titleKey =
    dto.titleKey != null && String(dto.titleKey).length > 0
      ? dto.titleKey
      : `bounded.environmental.monitorCards.${dto.id}.title`
  return createMonitoringCard({
    id: dto.id,
    shipmentId: dto.shipmentId ?? null,
    idProducto: dto.idProducto ?? null,
    idInventario: dto.idInventario ?? null,
    titleKey,
    productNombre: dto.productNombre ?? null,
    currentTemp: dto.currentTemp,
    rangeMin: dto.rangeMin,
    rangeMax: dto.rangeMax,
    status: dto.status,
    personLoc: dto.personLoc ?? null,
    staffRole: dto.staffRole ?? 'none',
    placementKind: dto.placementKind ?? null,
    routeDestinationLoc: dto.routeDestinationLoc ?? null,
    warehouseSpotLoc: dto.warehouseSpotLoc ?? null,
  })
}
