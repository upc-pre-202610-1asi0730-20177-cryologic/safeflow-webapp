/**
 * Unidad de flota con avance operativo (dominio).
 * @param {object} p
 * @param {string} p.rowId
 * @param {{ en?: string, es?: string }} p.nameLoc
 * @param {string} p.vehicleCode
 * @param {number} p.progress
 * @param {'on_route'|'available'|'maintenance'} p.status
 */
export function createAnalyticsFleetUnit(p) {
  return Object.freeze({
    rowId: p.rowId,
    nameLoc: p.nameLoc,
    vehicleCode: p.vehicleCode,
    progress: p.progress,
    status: p.status,
  })
}
