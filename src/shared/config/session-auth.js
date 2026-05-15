/** Clave de sesión demo; sustituye por token real (Pinia + API) cuando integres backend. */
export const SESSION_AUTH_KEY = 'sf_auth'

export function isSessionAuthed() {
  try {
    return sessionStorage.getItem(SESSION_AUTH_KEY) === '1'
  } catch {
    return false
  }
}

export function setSessionAuthed(on) {
  try {
    if (on) sessionStorage.setItem(SESSION_AUTH_KEY, '1')
    else sessionStorage.removeItem(SESSION_AUTH_KEY)
  } catch {
    /* sessionStorage no disponible */
  }
}
