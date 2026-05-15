import { toLocalizedText } from '../../shared/infrastructure/seed-data-localized.js'

/**
 * Agregación Inventario (Core): une `productos` + `inventario` del `db.json`
 * y expone filas compatibles con la tabla existente (`id` = idInventario).
 *
 * Estados de dominio (producto): disponible | en_riesgo | desechado | en_transito
 * Estados UI legacy: available | risk | discarded | in_transit
 */

/** @param {string} estado */
export function estadoProductoToUi(estado) {
  const m = {
    disponible: 'available',
    en_riesgo: 'risk',
    desechado: 'discarded',
    en_transito: 'in_transit',
  }
  return m[estado] ?? 'available'
}

/** @param {string} ui */
export function uiEstadoToProducto(ui) {
  const m = {
    available: 'disponible',
    risk: 'en_riesgo',
    inactive: 'desechado',
    discarded: 'desechado',
    in_transit: 'en_transito',
  }
  return m[ui] ?? 'disponible'
}

export function tempTone(tempMin, tempMax) {
  const lo = Number(tempMin)
  const hi = Number(tempMax)
  if (Number.isNaN(lo) || Number.isNaN(hi)) return 'chilled'
  if (hi <= 0 || lo < -10) return 'frozen'
  return 'chilled'
}

export function tempLabel(tempMin, tempMax) {
  const lo = Number(tempMin)
  const hi = Number(tempMax)
  const en = Number.isFinite(lo) && Number.isFinite(hi) ? `${lo}°C to ${hi}°C` : '—'
  const es = Number.isFinite(lo) && Number.isFinite(hi) ? `${lo}°C a ${hi}°C` : '—'
  return { en, es }
}

/** @param {unknown} value */
function finiteNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * Unifica rangos térmicos en °C desde un DTO de API.
 * En MockAPI el formulario guarda `tempMin`/`tempMax` (°C) y Faker puede rellenar
 * `temperaturaMin`/`temperaturaMax` en °F; priorizamos los campos del formulario.
 *
 * @param {object} resource
 * @returns {{ temperaturaMin: number | null, temperaturaMax: number | null }}
 */
export function resolveCelsiusTemps(resource) {
  const fromFormMin = finiteNumber(resource?.tempMin)
  const fromFormMax = finiteNumber(resource?.tempMax)
  const fromApiMin = finiteNumber(resource?.temperaturaMin)
  const fromApiMax = finiteNumber(resource?.temperaturaMax)

  if (fromFormMin != null || fromFormMax != null) {
    return {
      temperaturaMin: fromFormMin ?? fromApiMin,
      temperaturaMax: fromFormMax ?? fromApiMax,
    }
  }

  return { temperaturaMin: fromApiMin, temperaturaMax: fromApiMax }
}

/**
 * @param {object} inv - fila inventario
 * @param {object} prod - producto
 * @returns {object} legacy item shape for InventoryItemAssembler
 */
export function joinProductoInventarioToLegacyItem(inv, prod) {
  if (!inv || !prod) return null
  return {
    id: inv.idInventario,
    idProducto: prod.idProducto,
    idInventario: inv.idInventario,
    qty: inv.cantidad,
    status: estadoProductoToUi(prod.estado),
    tempTone: tempTone(prod.temperaturaMin, prod.temperaturaMax),
    name: toLocalizedText(prod.nombre),
    category: toLocalizedText(prod.categoria),
    tempLabel: tempLabel(prod.temperaturaMin, prod.temperaturaMax),
    location: toLocalizedText(inv.ubicacion),
    lote: prod.lote,
    fechaVencimiento: prod.fechaVencimiento,
    fechaIngreso: inv.fechaIngreso,
    temperaturaMin: prod.temperaturaMin,
    temperaturaMax: prod.temperaturaMax,
  }
}

/**
 * @param {object} db - raíz db.json
 * @returns {object[]}
 */
export function listLegacyItemsFromDb(db) {
  const invRoot = db?.inventory
  if (!invRoot) return []

  if (Array.isArray(invRoot.items) && invRoot.items.length && !invRoot.productos) {
    return invRoot.items
  }

  const productos = Array.isArray(invRoot.productos) ? invRoot.productos : []
  const inventario = Array.isArray(invRoot.inventario) ? invRoot.inventario : []
  const byProd = new Map(productos.map((p) => [p.idProducto, p]))

  return inventario
    .map((inv) => joinProductoInventarioToLegacyItem(inv, byProd.get(inv.idProducto)))
    .filter(Boolean)
}

function maxNumericSuffix(ids, patterns) {
  let max = 0
  for (const id of ids) {
    if (typeof id !== 'string') continue
    for (const re of patterns) {
      const m = re.exec(id)
      if (m) max = Math.max(max, parseInt(m[1], 10))
    }
  }
  return max
}

/**
 * @param {object[]} productos
 * @returns {string}
 */
export function nextProductoId(productos) {
  const ids = productos.map((p) => p.idProducto)
  const max = maxNumericSuffix(ids, [/^PROD-(\d+)$/i, /^p(\d+)$/])
  const n = max + 1
  return `PROD-${String(n).padStart(3, '0')}`
}

/**
 * @param {object[]} inventario
 * @returns {string}
 */
export function nextInventarioId(inventario) {
  const ids = inventario.map((row) => row.idInventario)
  const max = maxNumericSuffix(ids, [/^INV-(\d+)$/i, /^i(\d+)$/])
  const n = max + 1
  return `INV-${String(n).padStart(3, '0')}`
}
