/** Clave de sesión demo; sustituye por token real (Pinia + API) cuando integres backend. */
export const SESSION_AUTH_KEY = 'sf_auth'

export function isSessionAuthed() {
  try {
    return (
      sessionStorage.getItem(SESSION_AUTH_KEY) === '1' ||
      localStorage.getItem(SESSION_AUTH_KEY) === '1'
    )
  } catch {
    return false
  }
}

/**
 * @param {boolean} on
 * @param {{ persist?: boolean }} [options] — si `persist`, la sesión demo sobrevive al cerrar pestaña (`localStorage`).
 */
export function setSessionAuthed(on, options = {}) {
  const persist = options.persist === true
  try {
    if (on) {
      sessionStorage.setItem(SESSION_AUTH_KEY, '1')
      if (persist) {
        localStorage.setItem(SESSION_AUTH_KEY, '1')
      } else {
        localStorage.removeItem(SESSION_AUTH_KEY)
      }
    } else {
      sessionStorage.removeItem(SESSION_AUTH_KEY)
      localStorage.removeItem(SESSION_AUTH_KEY)
    }
  } catch {
    /* almacenamiento no disponible */
  }
}
