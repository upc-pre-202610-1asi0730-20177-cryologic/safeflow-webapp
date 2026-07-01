/**
 * Alertas: `GET /api/alerts/dashboard` (Azure) o KPIs desde `db.json` en desarrollo local.
 */

import db from '../../../server/db.json'
import { BaseApi, isRemoteApiBaseConfigured } from '../../shared/infrastructure/base-api.js'

function buildKpisFromDb(data) {
  const alertas = Array.isArray(data?.alerts?.alertas) ? data.alerts.alertas : []
  const activas = alertas.filter((a) => a.estado === 'activa').length
  const resueltas = alertas.filter((a) => a.estado === 'resuelta').length
  const ind = data?.system?.indicadores

  return [
    {
      id: 'shipments',
      value: alertas.length,
      trendPct: 5,
      trendUp: true,
      trendTone: 'positive',
      tone: 'blue',
      icon: 'package',
    },
    {
      id: 'completed',
      value: resueltas,
      trendPct: 3,
      trendUp: true,
      trendTone: 'positive',
      tone: 'green',
      icon: 'check',
    },
    {
      id: 'transit',
      value: activas,
      trendPct: 1.5,
      trendUp: false,
      trendTone: 'negative',
      tone: 'amber',
      icon: 'truck',
    },
    {
      id: 'delayed',
      value: ind?.productosEnRiesgo ?? 0,
      trendPct: 0.8,
      trendUp: true,
      trendTone: 'negative',
      tone: 'rose',
      icon: 'alert',
    },
  ]
}

function emptyAlertsDashboard() {
  return {
    kpis: buildKpisFromDb({ alerts: { alertas: [] }, system: { indicadores: {} } }),
    feedItems: [],
  }
}

/** @param {unknown} data */
function normalizeRemoteDashboard(data) {
  if (!data || typeof data !== 'object') return emptyAlertsDashboard()
  const d = /** @type {Record<string, unknown>} */ (data)
  return {
    kpis: Array.isArray(d.kpis) ? d.kpis : [],
    feedItems: Array.isArray(d.feedItems) ? d.feedItems : [],
  }
}

export async function fetchAlertsDashboard() {
  if (isRemoteApiBaseConfigured()) {
    try {
      const api = new BaseApi()
      const { data } = await api.http.get('api/alerts/dashboard')
      return normalizeRemoteDashboard(data)
    } catch (e) {
      console.error('[alerts] GET api/alerts/dashboard falló', e)
      return emptyAlertsDashboard()
    }
  }

  const data = db
  return {
    kpis: buildKpisFromDb(data),
    feedItems: [],
  }
}
