/**
 * Descarga un Blob como archivo. No revoca la URL hasta pasado un tiempo
 * para que el navegador pueda iniciar la descarga (revocar al instante la cancela a menudo).
 *
 * @param {Blob} blob
 * @param {string} filename
 * @returns {boolean} false si el entorno no permite descargar
 */
export function downloadBlobAsFile(blob, filename) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false

  const nav = window.navigator
  // IE / Edge legacy
  if (nav && typeof nav.msSaveOrOpenBlob === 'function') {
    nav.msSaveOrOpenBlob(blob, filename)
    return true
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.position = 'fixed'
  a.style.left = '-9999px'
  a.style.top = '0'
  document.body.appendChild(a)
  a.click()
  window.setTimeout(() => {
    a.remove()
    URL.revokeObjectURL(url)
  }, 2000)
  return true
}
