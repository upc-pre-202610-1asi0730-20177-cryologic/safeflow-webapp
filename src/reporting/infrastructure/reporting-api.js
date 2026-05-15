/**
 * Panel de informes: datos agregados desde `db.json` (desarrollo),
 * alineados con logística, inventario, monitoreo ambiental y alertas.
 */
import { buildReportingDashboardFromDb } from './reporting-dashboard.aggregate.js'

export async function fetchReportingDashboard() {
  return buildReportingDashboardFromDb()
}
