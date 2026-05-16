/**
 * Lectura térmica vs rango permitido del producto (°C).
 */

/** @param {unknown} currentTemp @param {unknown} rangeMin @param {unknown} rangeMax */
export function isTemperatureOutOfRange(currentTemp, rangeMin, rangeMax) {
  const t = Number(currentTemp)
  const lo = Number(rangeMin)
  const hi = Number(rangeMax)
  if (!Number.isFinite(t) || !Number.isFinite(lo) || !Number.isFinite(hi)) return false
  return t < lo || t > hi
}

/** @param {unknown} currentTemp @param {unknown} rangeMin @param {unknown} rangeMax */
export function thermalStatusFromReading(currentTemp, rangeMin, rangeMax) {
  return isTemperatureOutOfRange(currentTemp, rangeMin, rangeMax) ? 'warning' : 'safe'
}
