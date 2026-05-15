import { createLogisticsShipment } from '../domain/model/logistics-shipment.entity.js'

/**
 * @param {object} dto - Payload desde `fetchLogisticsTracking` (textos ya localizados).
 * @returns {ReturnType<typeof createLogisticsShipment>}
 */
export function toLogisticsShipmentEntity(dto) {
    return createLogisticsShipment({
        id: dto.id,
        idProducto: dto.idProducto ?? null,
        product: dto.product,
        carrier: dto.carrier,
        providerLine: dto.providerLine,
        routeFrom: dto.routeFrom,
        routeTo: dto.routeTo,
        placementKind: dto.placementKind === 'warehouse' ? 'warehouse' : 'route',
        status: dto.status,
        thermal: dto.thermal,
        currentTemp: dto.currentTemp,
        originPlace: dto.originPlace,
        originTime: dto.originTime,
        currentPlace: dto.currentPlace,
        destPlace: dto.destPlace,
        destTime: dto.destTime,
    })
}
