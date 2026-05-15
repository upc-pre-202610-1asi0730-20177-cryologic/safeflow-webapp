import { InventoryItem } from '../domain/model/inventory-item.entity.js'
import { toLocalizedText } from '../../shared/infrastructure/seed-data-localized.js'
import {
  resolveCelsiusTemps,
  tempLabel as buildTempRangeLabel,
  tempTone as buildTempTone,
} from './inventory-aggregate.js'

/** Slugs de ubicación del formulario → `seedData.places.*` (solo `location` se traduce). */
const LOCATION_SLUG_TO_SEED = {
  main: 't:places.main_warehouse',
  freezer1: 't:places.freezer1',
  coldRoom: 't:places.coldRoom',
  sectorB: 't:places.sectorB',
  almacen_a: 't:places.almacen_a',
  almacen_b: 't:places.almacen_b',
}

/**
 * Nombre / categoría / rango térmico: mismo texto en ambos idiomas (sin `seedData`).
 * @param {unknown} value
 * @returns {{ en: string, es: string } | null}
 */
function objectOrPlainBilingual(value) {
  if (value == null) return null
  if (typeof value === 'object' && !Array.isArray(value)) {
    if (Object.keys(value).length === 0) return null
    if ('en' in value || 'es' in value) return /** @type {{ en: string, es: string }} */ (value)
    return null
  }
  if (typeof value === 'string') {
    const s = value.trim()
    return s ? { en: s, es: s } : null
  }
  return null
}

/**
 * Ubicación: slug de formulario → traducción; otro string se muestra igual en EN/ES.
 * @param {unknown} value
 * @returns {{ en: string, es: string } | null}
 */
function locationFromApi(value) {
  if (value == null) return null
  if (typeof value === 'object' && !Array.isArray(value)) {
    if (Object.keys(value).length === 0) return null
    if ('en' in value || 'es' in value) return /** @type {{ en: string, es: string }} */ (value)
    return null
  }
  if (typeof value === 'string') {
    const s = value.trim()
    if (!s) return null
    const seedKey = LOCATION_SLUG_TO_SEED[s]
    return seedKey ? toLocalizedText(seedKey) : { en: s, es: s }
  }
  return null
}

/** MockAPI/Faker a veces devuelve `idProducto 1` en lugar de un SKU real. */
function sanitizeIdProducto(resource) {
  const raw = resource.idProducto
  if (raw == null || raw === '') return raw
  const s = String(raw).trim()
  const m = /^idProducto\s*(\d+)$/i.exec(s)
  if (m) return `PROD-${m[1].padStart(3, '0')}`
  return raw
}

const OPTIONAL_LOCALIZED_KEYS = ['name', 'category', 'tempLabel', 'location']
const OPTIONAL_SCALAR_KEYS = [
  'temperaturaMin',
  'temperaturaMax',
  'lote',
  'fechaVencimiento',
  'fechaIngreso',
  'idProducto',
  'idInventario',
]

function assignIfTruthy(source, keys, target) {
  for (const key of keys) {
    const value = source[key]
    if (value) target[key] = value
  }
}

/**
 * Mapea recursos de inventario (API / DTO) a entidades de dominio.
 * Mismo rol que `CategoryAssembler` / `TutorialAssembler` en learning-center.
 *
 * @class InventoryItemAssembler
 */
export class InventoryItemAssembler {
  /**
   * @param {object} resource - Payload con `id` (API) o fila de `db.json`.
   * @returns {InventoryItem}
   */
  static toEntityFromResource(resource) {
    const qtyRaw = resource.qty ?? resource.cantidad
    const qtyNum = Number(qtyRaw)
    const { temperaturaMin, temperaturaMax } = resolveCelsiusTemps(resource)
    const tempLabelResolved =
      objectOrPlainBilingual(resource.tempLabel) ??
      buildTempRangeLabel(temperaturaMin, temperaturaMax)
    const tempToneResolved =
      resource.tempTone === 'chilled' || resource.tempTone === 'frozen'
        ? resource.tempTone
        : buildTempTone(temperaturaMin, temperaturaMax)
    return new InventoryItem({
      rowId: resource.id,
      idProducto: sanitizeIdProducto(resource),
      idInventario: resource.idInventario,
      qty: Number.isFinite(qtyNum) ? qtyNum : 0,
      status: resource.status,
      tempTone: tempToneResolved,
      name: objectOrPlainBilingual(resource.name),
      category: objectOrPlainBilingual(resource.category),
      tempLabel: tempLabelResolved,
      location: locationFromApi(resource.location),
      temperaturaMin,
      temperaturaMax,
      lote: resource.lote,
      fechaVencimiento: resource.fechaVencimiento,
      fechaIngreso: resource.fechaIngreso,
    })
  }

  /**
   * @param {unknown} response - AxiosResponse u objeto con `data`.
   * @returns {object[]}
   */
  static extractItemDtos(response) {
    const data =
      response && typeof response === 'object' && 'data' in response ? response.data : response
    if (Array.isArray(data)) return data
    if (data && typeof data === 'object') {
      const nested = data.data
      if (nested && typeof nested === 'object' && Array.isArray(nested.items)) return nested.items
      if (Array.isArray(data.items)) return data.items
      if (Array.isArray(data.inventory?.items)) return data.inventory.items
    }
    return []
  }

  /**
   * @param {import('axios').AxiosResponse} response
   * @returns {InventoryItem[]}
   */
  static toEntitiesFromResponse(response) {
    const raw = InventoryItemAssembler.extractItemDtos(response)
    return raw
      .filter((dto) => dto != null && typeof dto === 'object')
      .map((dto) => InventoryItemAssembler.toEntityFromResource(dto))
  }

  /**
   * Cuerpo PUT: usa `id` del recurso o `rowId` del dominio.
   * @param {object} item
   */
  static toUpdatePayload(item) {
    const id = item.id ?? item.rowId
    if (id == null) {
      throw new Error('Inventory item id required')
    }
    const payload = {
      id,
      qty: item.qty,
      status: item.status,
      tempTone: item.tempTone,
    }
    assignIfTruthy(item, OPTIONAL_LOCALIZED_KEYS, payload)
    for (const key of OPTIONAL_SCALAR_KEYS) {
      const v = item[key]
      if (v !== undefined && v !== null) payload[key] = v
    }
    return payload
  }
}
