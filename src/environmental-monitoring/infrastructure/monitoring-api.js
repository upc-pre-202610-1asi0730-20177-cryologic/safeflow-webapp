/**
 * Monitoreo ambiental: una tarjeta por **envío activo** (`logistics.shipments` o `despachos` vía `listLegacyShipmentsFromDb`).
 * No se generan tarjetas solo por stock en almacén sin envío (evita productos huérfanos en MockAPI).
 * Con `VITE_API_BASE_URL` (MockAPI): los datos se arman desde **inventory-items** + **logistics-shipments** (`monitoring-live-payload.js`).
 * Opcional: `VITE_MONITORING_DB_SNAPSHOT_PATH` sigue teniendo prioridad si devuelve JSON válido.
 * Temperatura: último `registrosTemperatura` por `idProducto`; si el envío trae `currentTemp` y no hay sensor, se usa;
 * si no, punto medio del rango del producto.
 */

/** Snapshot empaquetado: solo si falla la lectura en vivo (sin dev server / fetch error). */
import staticDb from '../../../server/db.json'
import { listLegacyShipmentsFromDb } from '../../logistics/infrastructure/logistics-aggregate.js'
import {
  buildMonitoringPayloadFromRemoteApis,
  enrichShipmentsForMonitoring,
} from './monitoring-live-payload.js'
import { thermalStatusFromReading } from '../../shared/domain/thermal-range.js'
import {
  BaseApi,
  getApiBaseUrl,
  isRemoteApiBaseConfigured,
  jsonAuthHeaders,
  shouldAppendSameOriginCacheBuster,
} from '../../shared/infrastructure/base-api.js'
import { toLocalizedText } from '../../shared/infrastructure/seed-data-localized.js'

const monitoringSnapshotPath = import.meta.env.VITE_MONITORING_DB_SNAPSHOT_PATH?.trim() || ''

/** @param {unknown} data */
function unwrapMonitoringSnapshotRecord(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (isLiveInventoryPayload(raw)) return /** @type {object} */ (raw)
  const stringKeys = ['dbJson', 'json', 'payload', 'body']
  for (const k of stringKeys) {
    if (typeof raw[k] === 'string') {
      try {
        const o = JSON.parse(raw[k])
        if (isLiveInventoryPayload(o)) return o
      } catch {
        /* siguiente clave */
      }
    }
  }
  if (raw.snapshot && typeof raw.snapshot === 'object' && isLiveInventoryPayload(raw.snapshot)) {
    return raw.snapshot
  }
  if (raw.data && typeof raw.data === 'object' && isLiveInventoryPayload(raw.data)) {
    return raw.data
  }
  return null
}

/**
 * MockAPI: un recurso con al menos una fila; el JSON “tipo db.json” va en string `dbJson` o objeto anidado.
 * @param {string} path - slug sin barra inicial
 * @returns {Promise<object|null>}
 */
async function loadMonitoringSnapshotFromRemote(path) {
  const base = getApiBaseUrl().replace(/\/$/, '')
  const p = path.replace(/^\//, '')
  const qs = shouldAppendSameOriginCacheBuster() ? `?_=${Date.now()}` : ''
  async function tryFetch(url) {
    try {
      const res = await fetch(url, {
        headers: jsonAuthHeaders(),
        cache: 'no-store',
      })
      if (!res.ok) return null
      const ct = (res.headers.get('content-type') || '').toLowerCase()
      if (!ct.includes('application/json')) return null
      return await res.json()
    } catch {
      return null
    }
  }
  let raw = await tryFetch(`${base}/${p}/1${qs}`)
  if (raw == null) raw = await tryFetch(`${base}/${p}${qs}`)
  if (raw == null) return null
  const row = Array.isArray(raw) ? raw[0] : raw
  return unwrapMonitoringSnapshotRecord(row)
}

/** Respuesta real del middleware de inventario (no HTML del SPA ni `{}` vacío). */
function isLiveInventoryPayload(data) {
  return (
    data != null &&
    typeof data === 'object' &&
    Array.isArray(data.inventory?.inventario) &&
    Array.isArray(data.inventory?.productos)
  )
}

async function loadDbPayload() {
  if (typeof window === 'undefined') return staticDb
  if (monitoringSnapshotPath) {
    const snap = await loadMonitoringSnapshotFromRemote(monitoringSnapshotPath)
    if (snap && isLiveInventoryPayload(snap)) return snap
    console.warn(
      '[monitoring] VITE_MONITORING_DB_SNAPSHOT_PATH sin JSON válido — probando inventario+envíos remotos o /api/inventory',
    )
  }
  const fromApis = await buildMonitoringPayloadFromRemoteApis()
  if (fromApis && isLiveInventoryPayload(fromApis)) {
    return fromApis
  }
  try {
    const base = getApiBaseUrl().replace(/\/$/, '')
    const qs = shouldAppendSameOriginCacheBuster() ? `?_=${Date.now()}` : ''
    const url = `${base}/api/inventory${qs}`
    const res = await fetch(url, {
      headers: jsonAuthHeaders(),
      cache: 'no-store',
    })
    if (!res.ok) {
      console.warn('[monitoring] GET /api/inventory', res.status, '— usando snapshot empaquetado')
      return staticDb
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase()
    if (!ct.includes('application/json')) {
      const hint =
        import.meta.env.VITE_API_BASE_URL?.trim() &&
        ' En Beeceptor crea una mock rule para GET /api/inventory con cuerpo JSON y cabecera Content-Type: application/json.'
      console.warn(
        '[monitoring] GET /api/inventory no-JSON (',
        ct,
        ') — usando snapshot empaquetado.',
        hint || '',
      )
      return staticDb
    }
    const data = await res.json()
    if (!isLiveInventoryPayload(data)) {
      console.warn('[monitoring] GET /api/inventory cuerpo inválido — usando snapshot empaquetado')
      return staticDb
    }
    return data
  } catch (e) {
    console.warn('[monitoring] GET /api/inventory', e?.message ?? e, '— usando snapshot empaquetado')
    return staticDb
  }
}

/**
 * Última lectura por producto (por `fechaHora`), o null si no hay registros.
 * @param {object[]} registros
 * @param {string} idProducto
 */
function latestRegistroForProduct(registros, idProducto) {
  const list = registros.filter((r) => r.idProducto === idProducto)
  if (!list.length) return null
  return list.reduce((best, cur) => {
    const tb = best?.fechaHora ? new Date(best.fechaHora).getTime() : -Infinity
    const tc = cur?.fechaHora ? new Date(cur.fechaHora).getTime() : -Infinity
    return tc >= tb ? cur : best
  })
}

/**
 * KPIs desde envíos legacy (MockAPI: `logistics.shipments`; dev local: `despachos`).
 *
 * @param {object} data
 * @param {object[]} [monitorCards] — tarjetas ya calculadas (para “fuera de rango”)
 */
function buildKpis(data, monitorCards = []) {
  const shipments = listLegacyShipmentsFromDb(data)
  const total = shipments.length
  const completed = shipments.filter((s) => s.status === 'delivered').length
  const transit = shipments.filter((s) => s.status === 'transit').length
  const outOfRange = monitorCards.length
    ? monitorCards.filter((c) => c.status === 'warning').length
    : shipments.filter((s) => s.thermal === 'risk').length

  const neutralTrend = { trendPct: 0, trendUp: true, trendTone: 'positive' }

  return [
    {
      id: 'shipments',
      value: total,
      ...neutralTrend,
      tone: 'blue',
      icon: 'package',
    },
    {
      id: 'completed',
      value: completed,
      ...neutralTrend,
      tone: 'green',
      icon: 'check',
    },
    {
      id: 'transit',
      value: transit,
      trendPct: 0,
      trendUp: false,
      trendTone: 'negative',
      tone: 'amber',
      icon: 'truck',
    },
    {
      id: 'delayed',
      value: outOfRange,
      trendPct: 0,
      trendUp: outOfRange > 0,
      trendTone: outOfRange > 0 ? 'negative' : 'positive',
      tone: 'rose',
      icon: 'alert',
    },
  ]
}

/** @param {object} sh */
function shipmentInventoryKeys(sh) {
  const keys = new Set()
  for (const k of [sh.idInventario, sh.inventoryItemId]) {
    const s = k != null ? String(k).trim() : ''
    if (s) keys.add(s)
  }
  return keys
}

/** @param {object[]} inventario */
function buildInventarioIndex(inventario) {
  /** @type {Map<string, object>} */
  const byKey = new Map()
  for (const inv of inventario) {
    const id = inv.idInventario != null ? String(inv.idInventario).trim() : ''
    if (id) byKey.set(id, inv)
  }
  return byKey
}

/**
 * @param {object} sh
 * @param {Map<string, object>} byInv
 * @param {object[]} inventario
 */
function resolveInventarioForShipment(sh, byInv, inventario) {
  for (const k of shipmentInventoryKeys(sh)) {
    const row = byInv.get(k)
    if (row) return row
  }
  const pid = sh.idProducto != null ? String(sh.idProducto).trim() : ''
  if (pid) {
    return inventario.find((inv) => String(inv.idProducto) === pid) ?? null
  }
  return null
}

/** @param {unknown} carrier */
function carrierToPersonLoc(carrier) {
  if (!carrier || typeof carrier !== 'object') return null
  const en = String(carrier.en ?? '').trim()
  const es = String(carrier.es ?? '').trim()
  if ((!en || en === '—') && (!es || es === '—')) return null
  return { en: en || es, es: es || en }
}

/**
 * @param {object} sh
 * @param {object|null} d — fila `despachos` si existe
 */
function inferStaffRole(sh, d) {
  const fromDespacho = staffRoleFromDespacho(d)
  if (fromDespacho !== 'none') return fromDespacho
  const op = sh.operarioCodigo != null && String(sh.operarioCodigo).trim()
  const ch = sh.choferCodigo != null && String(sh.choferCodigo).trim()
  if (op && !ch) return 'operario'
  if (ch) return 'conductor'
  if (carrierToPersonLoc(sh.carrier)) return 'conductor'
  return 'none'
}

/** @param {object|null} d */
function staffRoleFromDespacho(d) {
  if (!d) return 'none'
  if (d.idOperario && !d.idChofer) return 'operario'
  if (d.idChofer) return 'conductor'
  return 'none'
}

/**
 * @param {object|null} sh — fila de `listLegacyShipmentsFromDb`
 * @param {object} data — db
 */
function logisticsFieldsForProduct(sh, data) {
  if (!sh) {
    return {
      personLoc: null,
      staffRole: 'none',
      placementKind: null,
      routeDestinationLoc: null,
      warehouseSpotLoc: null,
    }
  }
  const despachos = Array.isArray(data?.logistics?.despachos) ? data.logistics.despachos : []
  const d = despachos.find((x) => String(x.idDespacho) === String(sh.id)) ?? null
  const staffRole = inferStaffRole(sh, d)
  const personLoc = carrierToPersonLoc(sh.carrier)
  const placementKind = sh.placementKind === 'warehouse' ? 'warehouse' : 'route'
  let routeDestinationLoc = null
  let warehouseSpotLoc = null
  if (placementKind === 'warehouse') {
    const spot = sh.routeFrom
    warehouseSpotLoc =
      spot && typeof spot === 'object'
        ? { en: spot.en?.trim() || '—', es: spot.es?.trim() || '—' }
        : null
  } else {
    const dest = sh.routeTo
    routeDestinationLoc =
      dest && typeof dest === 'object'
        ? { en: dest.en?.trim() || '—', es: dest.es?.trim() || '—' }
        : null
    /** Almacén de partida (origen de ruta): en tránsito sigue siendo el sitio físico de salida. */
    const origin = sh.routeFrom
    warehouseSpotLoc =
      origin && typeof origin === 'object'
        ? { en: origin.en?.trim() || '—', es: origin.es?.trim() || '—' }
        : null
  }
  return { personLoc, staffRole, placementKind, routeDestinationLoc, warehouseSpotLoc }
}

/** @param {object} prod — fila `inventory.productos` */
function productNombreForCard(prod) {
  const t = toLocalizedText(prod?.nombre)
  if (t.en === '—' && t.es === '—') return null
  return t
}

/** @param {unknown} u — `inventario.ubicacion` */
function ubicacionToLoc(u) {
  const t = toLocalizedText(u)
  if (t.en === '—' && t.es === '—') return null
  return t
}

/**
 * @param {object} sh — fila `listLegacyShipmentsFromDb`
 * @param {Map<string, object>} byInv
 * @param {Map<string, object>} byProd
 * @param {object[]} registros
 * @param {object} data
 */
function monitorCardDtoFromShipment(sh, byInv, byProd, registros, data, inventario) {
  const inv = resolveInventarioForShipment(sh, byInv, inventario)
  const idProd = inv?.idProducto ?? sh.idProducto
  if (!idProd) return null
  const prod = byProd.get(idProd)
  if (!prod) return null
  const rangeMin = Number(prod.temperaturaMin)
  const rangeMax = Number(prod.temperaturaMax)
  const reg = latestRegistroForProduct(registros, prod.idProducto)
  const hasSensor = reg != null && Number.isFinite(Number(reg.temperatura))
  const hasShipmentTemp = sh.currentTemp != null && Number.isFinite(Number(sh.currentTemp))
  let t
  if (hasSensor) t = Number(reg.temperatura)
  else if (hasShipmentTemp) t = Number(sh.currentTemp)
  else t = (rangeMin + rangeMax) / 2
  const status = thermalStatusFromReading(t, rangeMin, rangeMax)
  const log = logisticsFieldsForProduct(sh, data)
  const spot = inv ? ubicacionToLoc(inv.ubicacion) : null
  const merged = {
    ...log,
    warehouseSpotLoc: log.warehouseSpotLoc ?? spot,
    placementKind: log.placementKind ?? (spot ? 'warehouse' : log.placementKind),
  }
  const invKey = String(sh.idInventario ?? sh.inventoryItemId ?? inv?.idInventario ?? '')
  const sid = sh.id != null && String(sh.id).trim() !== '' ? String(sh.id) : `orphan-${invKey || 'sh'}`
  return {
    id: `ship-${sid}`,
    shipmentId: sid,
    idInventario: inv?.idInventario ?? sh.idInventario ?? sh.inventoryItemId ?? null,
    idProducto: prod.idProducto,
    titleKey: `bounded.environmental.monitorPoints.${prod.idProducto}`,
    productNombre: productNombreForCard(prod),
    currentTemp: t,
    rangeMin,
    rangeMax,
    status,
    ...merged,
  }
}

function buildMonitorCards(data) {
  const registros = Array.isArray(data?.environmentalMonitoring?.registrosTemperatura)
    ? data.environmentalMonitoring.registrosTemperatura
    : []
  const productos = Array.isArray(data?.inventory?.productos) ? data.inventory.productos : []
  const inventario = Array.isArray(data?.inventory?.inventario) ? data.inventory.inventario : []
  const rawShipments = listLegacyShipmentsFromDb(data)
  const shipments = enrichShipmentsForMonitoring(rawShipments, inventario)
  const byProd = new Map(productos.map((p) => [p.idProducto, p]))
  const byInv = buildInventarioIndex(inventario)

  const shipmentsSorted = [...shipments].sort((a, b) => {
    const ta = a.fechaSalida ? new Date(a.fechaSalida).getTime() : 0
    const tb = b.fechaSalida ? new Date(b.fechaSalida).getTime() : 0
    return tb - ta
  })
  const fromShipments = shipmentsSorted
    .map((sh) => monitorCardDtoFromShipment(sh, byInv, byProd, registros, data, inventario))
    .filter(Boolean)

  /** Sin duplicados por `id` (MockAPI a veces repite filas). */
  const seen = new Set()
  return fromShipments.filter((card) => {
    const key = card.id != null ? String(card.id) : ''
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function fetchMonitoringDashboard() {
  if (isRemoteApiBaseConfigured()) {
    try {
      const api = new BaseApi()
      const { data } = await api.http.get('api/monitoring/dashboard')
      if (data && typeof data === 'object') {
        return {
          kpis: Array.isArray(data.kpis) ? data.kpis : [],
          monitorCards: Array.isArray(data.monitorCards) ? data.monitorCards : [],
        }
      }
    } catch (e) {
      console.error('[monitoring] GET api/monitoring/dashboard falló; usando agregación local', e)
    }
  }

  const data = await loadDbPayload()
  const monitorCards = buildMonitorCards(data)
  return {
    kpis: buildKpis(data, monitorCards),
    monitorCards,
  }
}
