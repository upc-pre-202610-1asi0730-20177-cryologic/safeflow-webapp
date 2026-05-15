/**
 * Tarjeta de lectura térmica en monitoreo ambiental (dominio).
 * @param {object} p
 * @param {string} p.id
 * @param {string} p.idProducto
 * @param {string|null} [p.idInventario] — línea de `inventory.inventario` (varias por mismo producto).
 * @param {string} p.titleKey
 * @param {{ en?: string, es?: string }|null} [p.productNombre] — nombre en catálogo (prioridad sobre `titleKey` en UI).
 * @param {number} p.currentTemp
 * @param {number} p.rangeMin
 * @param {number} p.rangeMax
 * @param {'safe'|'warning'} p.status
 * @param {{ en?: string, es?: string }|null} [p.personLoc]
 * @param {'conductor'|'operario'|'none'} [p.staffRole]
 * @param {'warehouse'|'route'|null} [p.placementKind]
 * @param {{ en?: string, es?: string }|null} [p.routeDestinationLoc]
 * @param {{ en?: string, es?: string }|null} [p.warehouseSpotLoc]
 * @param {string|null} [p.shipmentId] — id de envío (varias tarjetas por mismo producto)
 */
export function createMonitoringCard(p) {
  return Object.freeze({
    id: p.id,
    shipmentId: p.shipmentId ?? null,
    idProducto: p.idProducto ?? null,
    idInventario: p.idInventario ?? null,
    titleKey: p.titleKey,
    productNombre: p.productNombre ?? null,
    currentTemp: p.currentTemp,
    rangeMin: p.rangeMin,
    rangeMax: p.rangeMax,
    status: p.status,
    personLoc: p.personLoc ?? null,
    staffRole: p.staffRole ?? 'none',
    placementKind: p.placementKind ?? null,
    routeDestinationLoc: p.routeDestinationLoc ?? null,
    warehouseSpotLoc: p.warehouseSpotLoc ?? null,
  })
}
