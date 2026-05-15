/**
 * Ejecución / exportación reciente (dominio).
 * @param {object} p
 * @param {string} p.rowId
 * @param {string} p.titleKey
 * @param {string} p.generatedKey
 * @param {'pdf'|'csv'|'xlsx'} p.format
 * @param {'ready'|'processing'} p.status
 */
export function createReportingRun(p) {
  return Object.freeze({
    rowId: p.rowId,
    titleKey: p.titleKey,
    generatedKey: p.generatedKey,
    format: p.format,
    status: p.status,
  })
}
