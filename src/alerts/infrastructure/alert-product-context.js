/**
 * Contexto operativo por producto (ubicación + contacto) desde `db.json`.
 * En tránsito: ruta/destino del despacho activo y chofer asignado.
 * En almacén: ubicación del inventario y encargado local.
 */

import db from '../../../server/db.json'
import { toLocalizedText } from '../../shared/infrastructure/seed-data-localized.js'

function pick(msg, loc) {
  if (msg == null) return ''
  const t = toLocalizedText(msg)
  return loc === 'es' ? t.es : t.en
}

const emptyLoc = () => ({ en: '', es: '' })
const emptyName = () => ({ en: '', es: '' })

/**
 * @param {string} idProducto
 * @returns {{
 *   inTransit: boolean
 *   location: { en: string, es: string }
 *   contactName: { en: string, es: string }
 *   contactDetail: string
 *   idDespacho: string | null
 * }}
 */
export function buildAlertContextForProduct(idProducto) {
  const inventarios = Array.isArray(db?.inventory?.inventario) ? db.inventory.inventario : []
  const productos = Array.isArray(db?.inventory?.productos) ? db.inventory.productos : []
  const despachos = Array.isArray(db?.logistics?.despachos) ? db.logistics.despachos : []
  const choferes = Array.isArray(db?.logistics?.choferes) ? db.logistics.choferes : []

  const prod = productos.find((p) => p.idProducto === idProducto)
  const inv = inventarios.find((i) => i.idProducto === idProducto)

  if (!inv) {
    return {
      inTransit: false,
      location: emptyLoc(),
      contactName: emptyName(),
      contactDetail: '',
      idDespacho: null,
    }
  }

  const inTransit = prod?.estado === 'en_transito'

  if (inTransit) {
    const d = despachos.find((x) => x.idInventario === inv.idInventario && x.estado === 'en_transito')
    if (d) {
      const ch = choferes.find((c) => c.idChofer === d.idChofer)
      const curEn = pick(d.textos?.currentPlace, 'en')
      const curEs = pick(d.textos?.currentPlace, 'es')
      const destEn = pick(d.destino, 'en')
      const destEs = pick(d.destino, 'es')
      const sepEn = curEn && destEn ? ' → ' : ''
      const sepEs = curEs && destEs ? ' → ' : ''
      const location = {
        en: `${curEn}${sepEn}${destEn}`.trim() || 'In transit',
        es: `${curEs}${sepEs}${destEs}`.trim() || 'En tránsito',
      }
      const contactName = {
        en: ch ? pick(ch.nombre, 'en') : '',
        es: ch ? pick(ch.nombre, 'es') : '',
      }
      const contactDetail = ch?.contacto != null ? String(ch.contacto).trim() : ''
      return {
        inTransit: true,
        location,
        contactName,
        contactDetail,
        idDespacho: d.idDespacho ?? null,
      }
    }
  }

  const ubicEn = pick(inv.ubicacion, 'en')
  const ubicEs = pick(inv.ubicacion, 'es')
  const enc = inv.encargado
  const contactName = enc
    ? { en: pick(enc.nombre, 'en'), es: pick(enc.nombre, 'es') }
    : emptyName()
  const contactDetail = enc?.contacto != null ? String(enc.contacto).trim() : ''

  return {
    inTransit: false,
    location: { en: ubicEn, es: ubicEs },
    contactName,
    contactDetail,
    idDespacho: null,
  }
}
