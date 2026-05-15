/**
 * KPI del panel analítica (dominio).
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
export function createAnalyticsKpi(p) {
  return Object.freeze({
    id: p.id,
    titleKey: p.titleKey,
    value: p.value,
    trendPct: p.trendPct,
    trendUp: p.trendUp,
    trendTone: p.trendTone,
    tone: p.tone,
    icon: p.icon,
  })
}
