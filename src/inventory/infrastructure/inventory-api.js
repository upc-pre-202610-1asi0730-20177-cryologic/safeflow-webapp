/**
 * Pasarela HTTP del contexto Inventory (misma idea que `PublishingApi` en learning-center).
 */

import db from '../../../server/db.json'
import {
  BaseApi,
  getApiBaseUrl,
  isRemoteApiBaseConfigured,
  jsonAuthHeaders,
  shouldAppendSameOriginCacheBuster,
} from '../../shared/infrastructure/base-api.js'
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js'
import { InventoryItemAssembler } from './inventory-item.assembler.js'
import { listLegacyItemsFromDb } from './inventory-aggregate.js'

const itemsEndpointPath =
  import.meta.env.VITE_INVENTORY_ITEMS_PATH || 'api/inventory/items'

/**
 * Lista desde el mismo origen que el middleware de Vite (lee `server/db.json` en disco).
 * Evita el fallback `import db.json` del bundle, que en el navegador puede quedar **obsoleto**
 * tras POST/PUT aunque el archivo en disco haya cambiado.
 * @returns {Promise<import('../domain/model/inventory-item.entity.js').InventoryItem[]|null>}
 */
async function listItemsViaFetchNoStore() {
  if (typeof window === 'undefined') return null
  try {
    const base = getApiBaseUrl().replace(/\/$/, '')
    const path = String(itemsEndpointPath).replace(/^\//, '')
    const qs = shouldAppendSameOriginCacheBuster() ? `?_=${Date.now()}` : ''
    const url = `${base}/${path}${qs}`
    const res = await fetch(url, {
      headers: jsonAuthHeaders(),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const ct = (res.headers.get('content-type') || '').toLowerCase()
    if (!ct.includes('application/json')) return null
    const json = await res.json()
    return InventoryItemAssembler.toEntitiesFromResponse({ data: json })
  } catch {
    return null
  }
}

function staticItems() {
  const merged = listLegacyItemsFromDb(db)
  if (merged.length) return merged
  const legacy = db?.inventory?.items
  return legacy?.length ? legacy : null
}

/** Datos solo desde `db.json` empaquetado (sin filas inventadas). */
function listFromStaticDb() {
  try {
    const items = staticItems()
    if (items?.length) {
      return items.map((dto) => InventoryItemAssembler.toEntityFromResource(dto))
    }
    console.warn('[inventory] Sin ítems en db.json empaquetado; lista vacía.')
    return []
  } catch (e) {
    console.warn('[inventory] Lectura desde db.json empaquetado falló', e)
    return []
  }
}

/** Lista vacía + aviso si hay API remota, para no mostrar datos embebidos por error. */
/**
 * POST inventario: el formulario usa tempMin/tempMax (°C); la API canónica es temperaturaMin/Max.
 * No enviar tempMin/tempMax a MockAPI para evitar duplicados con valores Faker en °F.
 *
 * @param {object} payload
 */
function normalizeCreatePayload(payload) {
  if (!payload || typeof payload !== 'object') return payload
  const { tempMin, tempMax, ...rest } = payload
  const out = { ...rest }
  const min =
    tempMin !== undefined && tempMin !== null
      ? Number(tempMin)
      : out.temperaturaMin != null
        ? Number(out.temperaturaMin)
        : NaN
  const max =
    tempMax !== undefined && tempMax !== null
      ? Number(tempMax)
      : out.temperaturaMax != null
        ? Number(out.temperaturaMax)
        : NaN
  if (Number.isFinite(min)) out.temperaturaMin = min
  if (Number.isFinite(max)) out.temperaturaMax = max
  return out
}

function emptyListInsteadOfEmbeddedDb(context) {
  if (isRemoteApiBaseConfigured()) {
    console.error(
      `[inventory] ${context} Con VITE_API_BASE_URL activo no se usa db.json embebido. ` +
        'Usa npm run dev:mockapi, revisa Network / CORS y que el GET de colección devuelva un array JSON (mockapi.io falla con query ?_= en la URL).',
    )
    return []
  }
  return listFromStaticDb()
}

export class InventoryApi extends BaseApi {
  /** @type {BaseEndpoint} */
  #itemsEndpoint

  constructor() {
    super()
    this.#itemsEndpoint = new BaseEndpoint(this, itemsEndpointPath)
  }

  /**
   * @param {Record<string, unknown>} [params]
   * @returns {Promise<InventoryItem[]>}
   */
  async list(params = {}) {
    const query = { ...params }
    if (shouldAppendSameOriginCacheBuster()) {
      query._ = Date.now()
    }
    try {
      const response = await this.#itemsEndpoint.getAll(query)
      try {
        return InventoryItemAssembler.toEntitiesFromResponse(response)
      } catch (e) {
        console.warn('[inventory] Respuesta API con forma inesperada; reintentando con fetch en vivo.', e)
        const live = await listItemsViaFetchNoStore()
        if (live != null) return live
        return emptyListInsteadOfEmbeddedDb('Respuesta con forma inesperada.')
      }
    } catch (e) {
      console.warn('[inventory] No se pudo listar vía API; reintentando con fetch en vivo.', e)
      const live = await listItemsViaFetchNoStore()
      if (live != null) return live
      return emptyListInsteadOfEmbeddedDb('Listado remoto falló.')
    }
  }

  /**
   * @param {string|number} id
   * @returns {Promise<import('../domain/model/inventory-item.entity.js').InventoryItem>}
   */
  async getById(id) {
    try {
      const response = await this.#itemsEndpoint.getById(id)
      return InventoryItemAssembler.toEntityFromResource(response.data)
    } catch {
      if (isRemoteApiBaseConfigured()) {
        throw new Error(
          'Inventory item not found (API remota; no hay fallback a db.json embebido).',
        )
      }
      const items = staticItems()
      if (!items?.length) throw new Error('Inventory item not found')
      const raw = items.find((it) => String(it.id) === String(id))
      if (!raw) throw new Error('Inventory item not found')
      return InventoryItemAssembler.toEntityFromResource(raw)
    }
  }

  /** @param {object} payload */
  async create(payload) {
    const response = await this.#itemsEndpoint.create(normalizeCreatePayload(payload))
    return InventoryItemAssembler.toEntityFromResource(response.data)
  }

  /**
   * Nueva fila de inventario para un producto ya existente (mismo SKU, otro almacén/cantidad).
   * @param {{ idProducto: string, location: string, qty: number, fechaIngreso?: string }} payload
   */
  async createStockLine(payload) {
    const response = await this.http.post(`${itemsEndpointPath}/stock-line`, payload)
    return InventoryItemAssembler.toEntityFromResource(response.data)
  }

  /** @param {object} item */
  async update(item) {
    const payload = InventoryItemAssembler.toUpdatePayload(item)
    const response = await this.#itemsEndpoint.update(payload.id, payload)
    if (response.status === 204 || response.data == null) {
      return await this.getById(payload.id)
    }
    return InventoryItemAssembler.toEntityFromResource(response.data)
  }

  /** @param {string|number} id */
  async remove(id) {
    await this.#itemsEndpoint.delete(id)
  }
}
