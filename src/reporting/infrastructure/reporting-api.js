/**
 * Informes: `GET /api/reporting/dashboard` (Azure) o agregación desde `db.json` en local.
 */
import { BaseApi, isRemoteApiBaseConfigured } from '../../shared/infrastructure/base-api.js'
import { buildReportingDashboardFromDb } from './reporting-dashboard.aggregate.js'

function emptyReportingDashboard() {
  return {
    stats: [
      { id: 'a1', valueKind: 'number', value: 0 },
      { id: 'a2', valueKind: 'number', value: 0 },
      { id: 'a3', valueKind: 'number', value: 0 },
      { id: 'a4', valueKind: 'number', value: 0 },
    ],
    catalog: [],
    recentRuns: [],
  }
}

/** @param {unknown} data */
function normalizeRemoteDashboard(data) {
  if (!data || typeof data !== 'object') return emptyReportingDashboard()
  const d = /** @type {Record<string, unknown>} */ (data)
  return {
    stats: Array.isArray(d.stats) ? d.stats : [],
    catalog: Array.isArray(d.catalog) ? d.catalog : [],
    recentRuns: Array.isArray(d.recentRuns) ? d.recentRuns : [],
  }
}

export async function fetchReportingDashboard() {
  if (isRemoteApiBaseConfigured()) {
    try {
      const api = new BaseApi()
      const { data } = await api.http.get('api/reporting/dashboard')
      return normalizeRemoteDashboard(data)
    } catch (e) {
      console.error('[reporting] GET api/reporting/dashboard falló', e)
      return emptyReportingDashboard()
    }
  }
  return buildReportingDashboardFromDb()
}
