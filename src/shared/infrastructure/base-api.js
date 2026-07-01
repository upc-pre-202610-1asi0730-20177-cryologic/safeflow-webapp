import axios from 'axios'
import { clearAuthSession, getAuthToken } from '../config/session-auth.js'

/** Cabeceras JSON con Bearer token si hay sesión (para `fetch` fuera de Axios). */
export function jsonAuthHeaders(extra = {}) {
  const headers = { Accept: 'application/json', ...extra }
  const token = getAuthToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

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

/** @returns {boolean} */
export function isRemoteApiBaseConfigured() {
  const raw = import.meta.env.VITE_API_BASE_URL
  return typeof raw === 'string' && raw.trim().length > 0
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

    this.#http.interceptors.request.use((config) => {
      const token = getAuthToken()
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })

    this.#http.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          clearAuthSession()
          const path = typeof window !== 'undefined' ? window.location.pathname : ''
          if (path && !path.includes('/login') && !path.includes('/register')) {
            const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
            window.location.href = `${base}/login`
          }
        }
        return Promise.reject(error)
      },
    )
  }

  /** @returns {import('axios').AxiosInstance} */
  get http() {
    return this.#http
  }
}
