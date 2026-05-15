/**
 * Alertas (Supporting): `db.json` → `alerts.alertas`.
 */

import db from '../../../server/db.json'

function buildKpis(data) {
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

export async function fetchAlertsDashboard() {
  const data = db
  return {
    kpis: buildKpis(data),
    /** El feed térmico se arma en Pinia desde monitoreo en vivo (`rebuildThermalFeed`). */
    feedItems: [],
  }
}
