/**
 * Agrega datos del panel de informes a partir de `server/db.json`
 * (misma fuente que logística, inventario, monitoreo y alertas en desarrollo).
 */
import db from '../../../server/db.json'

function safeArray(pathGetter) {
  const v = pathGetter()
  return Array.isArray(v) ? v : []
}

/**
 * @returns {{ stats: object[], catalog: object[], recentRuns: object[] }}
 */
export function buildReportingDashboardFromDb() {
  const despachos = safeArray(() => db?.logistics?.despachos)
  const productos = safeArray(() => db?.inventory?.productos)
  const registros = safeArray(() => db?.environmentalMonitoring?.registrosTemperatura)
  const alertas = safeArray(() => db?.alerts?.alertas)

  const stats = [
    { id: 'a1', valueKind: 'number', value: despachos.length },
    { id: 'a2', valueKind: 'number', value: productos.length },
    { id: 'a3', valueKind: 'number', value: registros.length },
    { id: 'a4', valueKind: 'number', value: alertas.length },
  ]

  const catalog = [{ id: 'c1', format: 'pdf' }]

  const recentRuns = [{ id: 'r1', format: 'pdf', status: 'ready' }]

  return { stats, catalog, recentRuns }
}
