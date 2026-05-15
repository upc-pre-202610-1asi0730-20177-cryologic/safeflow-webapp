/**
 * Alerta en el feed (dominio).
 * @param {object} p
 * @param {string} p.id
 * @param {string|null} [p.idProducto] — para sincronizar lectura con monitoreo en vivo
 * @param {string} p.titleKey
 * @param {{ en?: string, es?: string }|null} [p.titleMessage] — texto desde `db.json` (prioridad en UI)
 * @param {string} [p.timeIso] — ISO 8601 para mostrar hora sin depender solo de i18n
 * @param {'high'|'low'} p.variant — exceso vs baja temperatura (acento e icono)
 * @param {'truck'|'warehouse'} p.locationIcon
 * @param {string} p.locationKey
 * @param {string} p.timeKey
 * @param {number} p.currentTemp
 * @param {number} p.limitTemp
 * @param {string|null} [p.productTitleKey] — i18n del nombre del producto (p. ej. monitorPoints) para títulos dinámicos
 * @param {{ en?: string, es?: string }|null} [p.contextLocation]
 * @param {{ en?: string, es?: string }|null} [p.contactName]
 * @param {string} [p.contactDetail]
 * @param {string|null} [p.idDespacho]
 * @param {{ en?: string, es?: string }|null} [p.productNombre] — nombre desde catálogo / monitoreo (alertas térmicas)
 * @param {number} [p.rangeMin] — límite inferior °C (alertas térmicas)
 * @param {number} [p.rangeMax] — límite superior °C (alertas térmicas)
 */
export function createAlertFeedItem(p) {
  return {
    id: p.id,
    idProducto: p.idProducto ?? null,
    titleKey: p.titleKey,
    titleMessage: p.titleMessage ?? null,
    productTitleKey: p.productTitleKey ?? null,
    productNombre: p.productNombre ?? null,
    rangeMin: p.rangeMin ?? null,
    rangeMax: p.rangeMax ?? null,
    timeIso: p.timeIso ?? null,
    variant: p.variant,
    locationIcon: p.locationIcon,
    locationKey: p.locationKey,
    timeKey: p.timeKey,
    currentTemp: p.currentTemp,
    limitTemp: p.limitTemp,
    contextLocation: p.contextLocation ?? null,
    contactName: p.contactName ?? null,
    contactDetail: p.contactDetail ?? '',
    idDespacho: p.idDespacho ?? null,
  }
}
