import { buildAlertContextForProduct } from './alert-product-context.js'
import { buildThermalAlertInstanceId } from '@/environmental-monitoring/domain/thermal-alert-instance-id.js'

/**
 * Genera DTOs de feed a partir de tarjetas de monitoreo con `status === 'warning'`.
 * @param {Array<{ idProducto: string, titleKey: string, currentTemp: number, rangeMin: number, rangeMax: number, status: string }>} cards
 */
export function thermalAlertDtosFromMonitorCards(cards) {
  if (!Array.isArray(cards)) return []
  return cards
    .filter((c) => c.status === 'warning' && c.idProducto)
    .map((card) => {
      const lo = Number(card.rangeMin)
      const hi = Number(card.rangeMax)
      const t = Number(card.currentTemp)
      const ctx = buildAlertContextForProduct(card.idProducto)
      return {
        id: buildThermalAlertInstanceId(card),
        idProducto: card.idProducto,
        titleKey: 'bounded.alerts.thermal.title',
        productTitleKey: card.titleKey,
        productNombre: card.productNombre ?? null,
        rangeMin: lo,
        rangeMax: hi,
        titleMessage: null,
        timeIso: null,
        /** Fuera de rango (arriba o abajo): siempre estilo de alerta alta (rojo). */
        variant: 'high',
        locationIcon: ctx.inTransit ? 'truck' : 'warehouse',
        locationKey: ctx.inTransit ? 'bounded.alerts.locations.transit' : 'bounded.alerts.locations.warehouse',
        timeKey: 'bounded.alerts.time.recent',
        currentTemp: t,
        limitTemp: t > hi ? hi : lo,
        contextLocation: ctx.location,
        contactName: ctx.contactName,
        contactDetail: ctx.contactDetail,
        idDespacho: ctx.idDespacho,
      }
    })
}
