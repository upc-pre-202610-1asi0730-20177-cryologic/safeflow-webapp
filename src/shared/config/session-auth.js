/** @typedef {{ token: string, id: number, username: string }} AuthSession */

const SESSION_KEY = 'sf_session'

/** @returns {AuthSession | null} */
export function getAuthSession() {
  try {
    const raw =
      sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.token && parsed?.username) return parsed
    return null
  } catch {
    return null
  }
}

/** @returns {string | null} */
export function getAuthToken() {
  return getAuthSession()?.token ?? null
}

export function isSessionAuthed() {
  return getAuthToken() != null
}

/**
 * @param {AuthSession} session
 * @param {{ persist?: boolean }} [options]
 */
export function setAuthSession(session, options = {}) {
  const persist = options.persist === true
  const raw = JSON.stringify(session)
  try {
    sessionStorage.setItem(SESSION_KEY, raw)
    if (persist) localStorage.setItem(SESSION_KEY, raw)
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* almacenamiento no disponible */
  }
}

export function clearAuthSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem('sf_auth')
    localStorage.removeItem('sf_auth')
  } catch {
    /* almacenamiento no disponible */
  }
}

/** @deprecated Usa setAuthSession / clearAuthSession */
export function setSessionAuthed(on, options = {}) {
  if (!on) clearAuthSession()
}
