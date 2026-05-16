/**
 * Convierte valores del `db.json` en `{ en, es }` para la UI.
 * - Cadenas sin prefijo: mismo texto en ambos idiomas (p. ej. nombres de medicamento).
 * - `t:clave.subclave`: busca `seedData.clave.subclave` en `en.json` / `es.json`.
 * - Objetos `{ en, es }` legacy: se respetan (compatibilidad con datos antiguos).
 */
import en from '../../locales/en.json'
import es from '../../locales/es.json'

function deepGet(obj, pathParts) {
  return pathParts.reduce((acc, k) => (acc != null && typeof acc === 'object' ? acc[k] : undefined), obj)
}

/**
 * @param {'en'|'es'} locale
 * @param {string} dotPath - sin prefijo `seedData.` (p. ej. `places.main_warehouse`)
 */
export function seedLookup(locale, dotPath) {
  const root = locale === 'es' ? es : en
  const parts = ['seedData', ...dotPath.split('.').filter(Boolean)]
  const v = deepGet(root, parts)
  return typeof v === 'string' ? v : undefined
}

/**
 * @param {unknown} value
 * @returns {{ en: string, es: string }}
 */
export function toLocalizedText(value) {
  if (value == null || value === '') return { en: '—', es: '—' }
  if (typeof value === 'object' && !Array.isArray(value) && ('en' in value || 'es' in value)) {
    const enV = value.en != null ? String(value.en).trim() : ''
    const esV = value.es != null ? String(value.es).trim() : ''
    return { en: enV || esV || '—', es: esV || enV || '—' }
  }
  if (typeof value === 'string') {
    const s = value.trim()
    if (!s) return { en: '—', es: '—' }
    if (s.startsWith('t:')) {
      const rel = s.slice(2).trim()
      const enT = seedLookup('en', rel)
      const esT = seedLookup('es', rel)
      const fallback = rel || '—'
      return {
        en: enT ?? esT ?? fallback,
        es: esT ?? enT ?? fallback,
      }
    }
    return { en: s, es: s }
  }
  return { en: '—', es: '—' }
}
