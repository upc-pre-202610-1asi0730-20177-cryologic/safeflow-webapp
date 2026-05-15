/**
 * Texto bilingüe (mismo criterio que ítems de inventario en `db.json`).
 * @typedef {{ en?: string, es?: string }} LocalizedText
 */

/**
 * Envío para tracking y tabla (dominio).
 * Los textos del negocio vienen como `LocalizedText` cuando el origen es `db.json` / inventario.
 *
 * @param {object} p
 * @param {string} p.id — ej. S001
 * @param {string|null} [p.idProducto] — inventario → producto (monitoreo térmico)
 * @param {LocalizedText} p.product
 * @param {LocalizedText} p.carrier — nombre del chofer (UI; propiedad histórica `carrier`)
 * @param {LocalizedText} p.providerLine — chofer • tipo de vehículo
 * @param {LocalizedText} p.routeFrom
 * @param {LocalizedText} p.routeTo
 * @param {'route'|'warehouse'} [p.placementKind] — `warehouse`: ubicación fija en almacén (nivel/zona), sin ruta exterior
 * @param {'transit'|'delivered'|'pending'} p.status
 * @param {'safe'|'risk'} p.thermal
 * @param {number|null} p.currentTemp
 * @param {LocalizedText} p.originPlace
 * @param {LocalizedText} p.originTime
 * @param {LocalizedText} p.currentPlace
 * @param {LocalizedText} p.destPlace
 * @param {LocalizedText} p.destTime
 */
export function createLogisticsShipment(p) {
    return Object.freeze({
        id: p.id,
        idProducto: p.idProducto ?? null,
        product: p.product,
        carrier: p.carrier,
        providerLine: p.providerLine,
        routeFrom: p.routeFrom,
        routeTo: p.routeTo,
        placementKind: p.placementKind === 'warehouse' ? 'warehouse' : 'route',
        status: p.status,
        thermal: p.thermal,
        currentTemp: p.currentTemp,
        originPlace: p.originPlace,
        originTime: p.originTime,
        currentPlace: p.currentPlace,
        destPlace: p.destPlace,
        destTime: p.destTime,
    })
}
