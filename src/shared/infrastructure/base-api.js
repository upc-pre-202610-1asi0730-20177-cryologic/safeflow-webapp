import axios from 'axios'

/**
 * Origen para JSON (`api/...`). Si defines `VITE_API_BASE_URL` (p. ej. Beeceptor),
 * inventario / logística y el fetch de monitoreo apuntan ahí en lugar del mismo host del SPA.
 * @returns {string}
 */
export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim().replace(/\/$/, '')
  }
  const path = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  if (typeof window === 'undefined') {
    return path === '' ? '/' : `${path}/`
  }
  return path === '' ? window.location.origin : `${window.location.origin}${path}`
}

/**
 * El query `?_=` evita caché del navegador en la API del mismo origen (middleware Vite).
 * Servicios como mockapi.io responden 404 si se envían query params no reconocidos.
 * @returns {boolean}
 */
export function shouldAppendSameOriginCacheBuster() {
  if (typeof window === 'undefined') return true
  try {
    const base = getApiBaseUrl()
    const resolved = new URL(base, window.location.href)
    return resolved.origin === window.location.origin
  } catch {
    return false
  }
}

/**
 * Cliente HTTP compartido. Respeta `import.meta.env.BASE_URL` (subrutas en Vite)
 * o `VITE_API_BASE_URL` si está definida.
 */
export class BaseApi {
  /** @type {import('axios').AxiosInstance} */
  #http

  constructor() {
    const baseURL = getApiBaseUrl()
    this.#http = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        // Evita que el SPA fallback de Vite devuelva index.html en rutas `/api/*` (Accept */*).
        Accept: 'application/json',
      },
    })
  }

  /** @returns {import('axios').AxiosInstance} */
  get http() {
    return this.#http
  }
}
