/**
 * Analítica: `GET /api/analytics/dashboard` (Azure) o agregación local vía logística / db.json.
 */

import db from '../../../server/db.json'
import { BaseApi, isRemoteApiBaseConfigured } from '../../shared/infrastructure/base-api.js'
import { listLegacyShipmentsFromDb } from '../../logistics/infrastructure/logistics-aggregate.js'
import { logisticsApi } from '../../logistics/infrastructure/logistics-api.js'
import { toLocalizedText } from '../../shared/infrastructure/seed-data-localized.js'

function pickName(p) {
  return toLocalizedText(p?.nombre)
}

function stableHash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function buildKpis(shipments) {
  const total = shipments.length
  const completed = shipments.filter((s) => s.status === 'delivered').length
  const transit = shipments.filter((s) => s.status === 'transit').length
  const delayed = shipments.filter((s) => s.status !== 'delivered' && s.thermal === 'risk').length

  const neutralTrend = { trendPct: 0, trendUp: true, trendTone: 'positive' }

  return [
    { id: 'shipments', value: total, ...neutralTrend, tone: 'blue', icon: 'package' },
    { id: 'completed', value: completed, ...neutralTrend, tone: 'green', icon: 'check' },
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
      value: delayed,
      trendPct: 0,
      trendUp: delayed > 0,
      trendTone: delayed > 0 ? 'negative' : 'positive',
      tone: 'rose',
      icon: 'alert',
    },
  ]
}

function buildDeliveryMix(shipments) {
  const n = Math.max(shipments.length, 1)
  const delivered = shipments.filter((s) => s.status === 'delivered').length
  const delayed = shipments.filter((s) => s.status !== 'delivered' && s.thermal === 'risk').length
  const transit = shipments.filter((s) => s.status === 'transit' && s.thermal !== 'risk').length
  const pending = shipments.filter((s) => s.status === 'pending' && s.thermal !== 'risk').length
  return {
    deliveredPct: Math.round((delivered / n) * 100),
    transitPct: Math.round((transit / n) * 100),
    pendingPct: Math.round((pending / n) * 100),
    delayedPct: Math.round((delayed / n) * 100),
  }
}

/** @param {{ fechaSalida?: string | null }[]} rows */
function buildChartWeekKeys(rows) {
  const now = new Date()
  const out = []
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now)
    day.setDate(day.getDate() - i)
    day.setHours(0, 0, 0, 0)
    const key = day.toISOString().slice(0, 10)
    const t0 = day.getTime()
    const t1 = t0 + 86400000
    const value = rows.filter((d) => {
      const t = new Date(d.fechaSalida).getTime()
      return !Number.isNaN(t) && t >= t0 && t < t1
    }).length
    out.push({ key, value })
  }
  return out
}

/** @param {{ fechaSalida?: string | null }[]} rows */
function buildChartMonthKeys(rows) {
  const counts = new Map()
  for (const d of rows) {
    const dt = new Date(d.fechaSalida)
    if (Number.isNaN(dt.getTime())) continue
    const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
    counts.set(ym, (counts.get(ym) || 0) + 1)
  }
  const keys = [...counts.keys()].sort()
  return keys.slice(-6).map((key) => ({ key, value: counts.get(key) ?? 0 }))
}

function carrierMatchesChofer(carrier, chofer) {
  const cn = String(carrier?.en ?? carrier?.es ?? '')
    .toLowerCase()
    .trim()
  if (!cn || cn === '—') return false
  const name = pickName(chofer)
  const fn = String(name.en ?? '')
    .toLowerCase()
    .trim()
  const fs = String(name.es ?? '')
    .toLowerCase()
    .trim()
  const head = cn.split('·')[0].trim()
  return (
    (fn && (cn.includes(fn) || head.includes(fn) || fn.includes(head))) ||
    (fs && (cn.includes(fs) || head.includes(fs) || fs.includes(head)))
  )
}

function buildFleet(shipments, choferes) {
  const transit = shipments.filter((s) => s.status === 'transit')
  const onRouteIds = new Set()

  for (const s of transit) {
    if (s.idChofer != null && String(s.idChofer).trim()) {
      onRouteIds.add(String(s.idChofer))
      continue
    }
    const code = s.choferCodigo != null ? String(s.choferCodigo).trim() : ''
    if (code) {
      const ch = choferes.find(
        (c) => String(c.codigo ?? '') === code || String(c.idChofer ?? '') === code,
      )
      if (ch?.idChofer) onRouteIds.add(String(ch.idChofer))
    }
  }

  for (const s of transit) {
    if (s.idChofer || s.choferCodigo) continue
    const carrier =
      typeof s.carrier === 'object' && s.carrier ? s.carrier : { en: String(s.carrier ?? ''), es: '' }
    for (const c of choferes) {
      if (carrierMatchesChofer(carrier, c)) onRouteIds.add(String(c.idChofer))
    }
  }

  const drivers = choferes.filter((c) => c.rol !== 'operario')
  const rows = drivers.map((c) => {
    const onRoute = onRouteIds.has(String(c.idChofer))
    const h = stableHash(String(c.idChofer))
    const progress = onRoute ? 42 + (h % 48) : 100
    return {
      id: c.idChofer,
      nameLoc: pickName(c),
      vehicleCode: String(c.codigo ?? '—'),
      progress,
      status: onRoute ? 'on_route' : 'available',
    }
  })
  rows.sort((a, b) => {
    if (a.status === b.status) return 0
    return a.status === 'on_route' ? -1 : 1
  })
  return rows.slice(0, 5)
}

export function buildAnalyticsDashboardFromData(shipments, choferes) {
  const list = Array.isArray(shipments) ? shipments : []
  const drivers = Array.isArray(choferes) ? choferes : []

  const sorted = [...list].sort((a, b) => {
    const ta = a.fechaSalida ? new Date(a.fechaSalida).getTime() : 0
    const tb = b.fechaSalida ? new Date(b.fechaSalida).getTime() : 0
    return tb - ta
  })

  const recentShipments = sorted.slice(0, 5).map((s) => ({
    id: `s-${s.id}`,
    trackingId: s.id,
    status: s.status,
    destination: s.routeTo ?? { en: '—', es: '—' },
    carrier: typeof s.carrier === 'object' && s.carrier ? s.carrier : { en: '—', es: '—' },
    dateIso: s.fechaSalida ?? null,
  }))

  return {
    kpis: buildKpis(list),
    deliveryMix: buildDeliveryMix(list),
    recentShipments,
    fleet: buildFleet(list, drivers),
    chartWeek: buildChartWeekKeys(list),
    chartMonth: buildChartMonthKeys(list),
  }
}

function emptyAnalyticsDashboard() {
  return {
    kpis: buildKpis([]),
    deliveryMix: { deliveredPct: 0, transitPct: 0, pendingPct: 0, delayedPct: 0 },
    recentShipments: [],
    fleet: [],
    chartWeek: buildChartWeekKeys([]),
    chartMonth: [],
  }
}

/** @param {unknown} data */
function normalizeRemoteDashboard(data) {
  if (!data || typeof data !== 'object') return emptyAnalyticsDashboard()
  const d = /** @type {Record<string, unknown>} */ (data)
  return {
    kpis: Array.isArray(d.kpis) ? d.kpis : [],
    deliveryMix: d.deliveryMix ?? { deliveredPct: 0, transitPct: 0, pendingPct: 0, delayedPct: 0 },
    recentShipments: Array.isArray(d.recentShipments) ? d.recentShipments : [],
    fleet: Array.isArray(d.fleet) ? d.fleet : [],
    chartWeek: Array.isArray(d.chartWeek) ? d.chartWeek : [],
    chartMonth: Array.isArray(d.chartMonth) ? d.chartMonth : [],
  }
}

async function fetchFromLocalSources() {
  try {
    const [shipments, choferes] = await Promise.all([
      logisticsApi.listShipments(),
      logisticsApi.listChoferes(),
    ])
    return buildAnalyticsDashboardFromData(shipments, choferes)
  } catch (e) {
    console.warn('[analytics] API de logística no disponible; usando db.json empaquetado', e)
  }

  const log = db?.logistics
  const choferes = Array.isArray(log?.choferes) ? log.choferes : []
  const shipments = listLegacyShipmentsFromDb(db)
  return buildAnalyticsDashboardFromData(shipments, choferes)
}

export async function fetchAnalyticsDashboard() {
  if (isRemoteApiBaseConfigured()) {
    try {
      const api = new BaseApi()
      const { data } = await api.http.get('api/analytics/dashboard')
      return normalizeRemoteDashboard(data)
    } catch (e) {
      console.error('[analytics] GET api/analytics/dashboard falló', e)
      return emptyAnalyticsDashboard()
    }
  }
  return fetchFromLocalSources()
}
