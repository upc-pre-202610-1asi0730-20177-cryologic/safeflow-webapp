/**
 * Entrada del catálogo de informes exportables (dominio).
 * @param {object} p
 * @param {string} p.id
 * @param {string} p.titleKey
 * @param {string} p.descriptionKey
 * @param {'pdf'|'csv'|'xlsx'} p.format
 */
export function createReportingCatalogItem(p) {
  return Object.freeze({
    id: p.id,
    titleKey: p.titleKey,
    descriptionKey: p.descriptionKey,
    format: p.format,
  })
}
