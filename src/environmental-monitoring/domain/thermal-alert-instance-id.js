/**
 * Id de alerta térmica por **instancia** (tarjeta de monitoreo / envío), no solo por producto.
 * Debe coincidir con la construcción en `thermal-alert-feed.assembler.js`.
 *
 * @param {{ idProducto?: string|null, id?: string|null, idInventario?: string|null }} card
 * @returns {string|null}
 */
export function buildThermalAlertInstanceId(card) {
  if (!card || card.idProducto == null || String(card.idProducto).trim() === '') return null
  const idProducto = String(card.idProducto)
  const inv = card.idInventario != null ? String(card.idInventario) : ''
  const cardSlug = card.id != null && String(card.id) ? String(card.id) : inv
  return `thermal-${idProducto}__${cardSlug}`
}

/**
 * @param {string} alertId
 * @returns {{ idProducto: string|null, monitorCardKey: string|null }}
 */
export function parseThermalAlertInstanceId(alertId) {
  const s = String(alertId)
  if (!s.startsWith('thermal-')) {
    return { idProducto: null, monitorCardKey: null }
  }
  const rest = s.slice('thermal-'.length)
  const sep = rest.indexOf('__')
  if (sep === -1) {
    return { idProducto: rest || null, monitorCardKey: null }
  }
  return {
    idProducto: rest.slice(0, sep) || null,
    monitorCardKey: rest.slice(sep + 2) || null,
  }
}
