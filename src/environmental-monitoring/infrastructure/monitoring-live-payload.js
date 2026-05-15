/**
 * Arma el JSON “tipo db.json” para Monitoring leyendo los mismos endpoints que Inventory y Logistics (MockAPI).
 */

import { uiEstadoToProducto } from '@/inventory/infrastructure/inventory-aggregate.js'
import { InventoryApi } from '@/inventory/infrastructure/inventory-api.js'
import { logisticsApi } from '@/logistics/infrastructure/logistics-api.js'

/**
 * @param {import('@/inventory/domain/model/inventory-item.entity.js').InventoryItem[]} items
 * @returns {{ inventario: object[], productos: object[] }}
 */
function mapInventoryItemsToLegacyTables(items) {
  if (!Array.isArray(items) || !items.length) {
    return { inventario: [], productos: [] }
  }
  /** @type {Map<string, object>} */
  const productoById = new Map()
  const inventario = []
  for (const it of items) {
    const idP = it.idProducto != null ? String(it.idProducto).trim() : ''
    if (!idP) continue
    const idInv = String(it.idInventario ?? it.rowId ?? '').trim() || idP
    inventario.push({
      idInventario: idInv,
      idProducto: idP,
      cantidad: Math.max(0, Number(it.qty) || 0),
      ubicacion: it.location ?? { en: '—', es: '—' },
      fechaIngreso: it.fechaIngreso ?? '',
    })
    const estadoFila = uiEstadoToProducto(it.status ?? 'available')
    const lo = Number(it.temperaturaMin)
    const hi = Number(it.temperaturaMax)
    const candidate = {
      idProducto: idP,
      nombre:
        it.name && (String(it.name.en ?? '').trim() || String(it.name.es ?? '').trim())
          ? { en: String(it.name.en ?? '').trim() || String(it.name.es), es: String(it.name.es ?? '').trim() || String(it.name.en) }
          : { en: idP, es: idP },
      categoria:
        it.category && (String(it.category.en ?? '').trim() || String(it.category.es ?? '').trim())
          ? {
              en: String(it.category.en ?? '').trim() || String(it.category.es),
              es: String(it.category.es ?? '').trim() || String(it.category.en),
            }
          : { en: '—', es: '—' },
      temperaturaMin: Number.isFinite(lo) ? lo : 2,
      temperaturaMax: Number.isFinite(hi) ? hi : 8,
      fechaVencimiento: it.fechaVencimiento ?? '',
      lote: it.lote ?? '',
      estado: estadoFila,
    }
    const existing = productoById.get(idP)
    if (!existing) {
      productoById.set(idP, candidate)
    } else {
      if (estadoFila === 'en_transito') existing.estado = 'en_transito'
      if (Number.isFinite(lo)) {
        const eLo = Number(existing.temperaturaMin)
        existing.temperaturaMin = Number.isFinite(eLo) ? Math.min(eLo, lo) : lo
      }
      if (Number.isFinite(hi)) {
        const eHi = Number(existing.temperaturaMax)
        existing.temperaturaMax = Number.isFinite(eHi) ? Math.max(eHi, hi) : hi
      }
    }
  }
  return { inventario, productos: [...productoById.values()] }
}

/**
 * Alinea claves de envío con filas de inventario y rellena `idProducto` para tarjetas de monitoreo.
 *
 * @param {object[]} shipments
 * @param {object[]} inventario
 */
export function enrichShipmentsForMonitoring(shipments, inventario) {
  if (!Array.isArray(shipments) || !shipments.length) return []
  const byInv = new Map()
  for (const inv of inventario) {
    const id = inv.idInventario != null ? String(inv.idInventario).trim() : ''
    if (id) byInv.set(id, inv)
  }
  return shipments.map((sh) => {
    if (!sh || typeof sh !== 'object') return sh
    const keys = [
      sh.idInventario,
      sh.inventoryItemId,
    ]
      .map((k) => (k != null ? String(k).trim() : ''))
      .filter(Boolean)
    let inv = null
    for (const k of keys) {
      inv = byInv.get(k)
      if (inv) break
    }
    const idProducto =
      sh.idProducto != null && String(sh.idProducto).trim()
        ? String(sh.idProducto).trim()
        : inv?.idProducto != null
          ? String(inv.idProducto)
          : null
    const idInventario =
      inv?.idInventario != null
        ? String(inv.idInventario)
        : keys[0] || sh.idInventario || sh.inventoryItemId
    return {
      ...sh,
      idProducto: idProducto ?? sh.idProducto,
      idInventario,
      inventoryItemId: idInventario,
    }
  })
}

/**
 * Solo cuando `VITE_API_BASE_URL` está definida (MockAPI, etc.): inventario + envíos en paralelo.
 * @returns {Promise<object|null>}
 */
export async function buildMonitoringPayloadFromRemoteApis() {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (typeof raw !== 'string' || !raw.trim()) return null

  const inventoryApi = new InventoryApi()
  const [items, shipments] = await Promise.all([
    inventoryApi.list().catch(() => []),
    logisticsApi.listShipments().catch(() => []),
  ])

  const { inventario, productos } = mapInventoryItemsToLegacyTables(items)
  const shipList = enrichShipmentsForMonitoring(
    Array.isArray(shipments) ? shipments : [],
    inventario,
  )

  return {
    inventory: { inventario, productos },
    logistics: { shipments: shipList },
    environmentalMonitoring: { registrosTemperatura: [] },
    system: { indicadores: {} },
  }
}
