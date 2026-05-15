/**
 * Fila de envío reciente (dominio). Textos bilingües alineados con logística (`routeTo`, `carrier`).
 * @param {object} p
 * @param {string} p.rowId
 * @param {string} p.trackingId
 * @param {{ en?: string, es?: string }} p.destination
 * @param {{ en?: string, es?: string }} p.carrier
 * @param {string|null} p.dateIso — `fechaSalida` del despacho
 * @param {'delivered'|'transit'|'pending'|'delayed'} p.status
 */
export function createAnalyticsShipmentRow(p) {
  return Object.freeze({
    rowId: p.rowId,
    trackingId: p.trackingId,
    destination: p.destination,
    carrier: p.carrier,
    dateIso: p.dateIso,
    status: p.status,
  })
}
