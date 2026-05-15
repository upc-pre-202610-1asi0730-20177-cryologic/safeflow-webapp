/**
 * Métrica resumida en el panel de informes (dominio).
 * @param {object} p
 * @param {string} p.id
 * @param {string} p.labelKey
 * @param {'number'|'text'} p.valueKind
 * @param {number} [p.value]
 * @param {string} [p.textKey] — clave i18n cuando valueKind es 'text'
 */
export function createReportingStat(p) {
  return Object.freeze({
    id: p.id,
    labelKey: p.labelKey,
    valueKind: p.valueKind,
    value: p.value,
    textKey: p.textKey,
  })
}
