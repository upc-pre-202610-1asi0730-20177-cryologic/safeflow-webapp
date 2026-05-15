import { createAlertFeedItem } from '../domain/model/alert-feed-item.entity.js'

export function toAlertFeedItemEntity(dto) {
  const base = `bounded.alerts.items.${dto.id}`
  const titleKey =
    dto.titleKey != null && String(dto.titleKey).length > 0
      ? dto.titleKey
      : `${base}.title`
  const locationKey =
    dto.locationKey != null && String(dto.locationKey).length > 0
      ? dto.locationKey
      : `${base}.location`
  const timeKey =
    dto.timeKey != null && String(dto.timeKey).length > 0
      ? dto.timeKey
      : `${base}.time`
  return createAlertFeedItem({
    id: dto.id,
    idProducto: dto.idProducto ?? null,
    titleKey,
    titleMessage: dto.titleMessage ?? null,
    productTitleKey: dto.productTitleKey ?? null,
    productNombre: dto.productNombre ?? null,
    rangeMin: dto.rangeMin ?? null,
    rangeMax: dto.rangeMax ?? null,
    timeIso: dto.timeIso ?? null,
    variant: dto.variant,
    locationIcon: dto.locationIcon,
    locationKey,
    timeKey,
    currentTemp: dto.currentTemp,
    limitTemp: dto.limitTemp,
    contextLocation: dto.contextLocation ?? null,
    contactName: dto.contactName ?? null,
    contactDetail: dto.contactDetail ?? '',
    idDespacho: dto.idDespacho ?? null,
  })
}
