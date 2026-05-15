/**
 * KPI del panel de monitoreo ambiental (dominio).
 * @param {object} p
 * @param {string} p.id
 * @param {string} p.titleKey
 * @param {number} p.value
 * @param {number} p.trendPct
 * @param {boolean} p.trendUp
 * @param {'positive'|'negative'} p.trendTone
 * @param {'blue'|'green'|'amber'|'rose'} p.tone
 * @param {'package'|'check'|'truck'|'alert'} p.icon
 */
export function createMonitoringKpi(p) {
  const n = Number(p.value)
  return Object.freeze({
    id: p.id,
    titleKey: p.titleKey,
    value: Number.isFinite(n) ? n : 0,
    trendPct: p.trendPct,
    trendUp: p.trendUp,
    trendTone: p.trendTone,
    tone: p.tone,
    icon: p.icon,
  })
}
