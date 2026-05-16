/**
 * Middleware de desarrollo: `/api/logistics/shipments` ↔ `db.json` → `logistics.despachos`.
 */
import fs from 'node:fs'
import {
  listLegacyShipmentsFromDb,
  nextChoferId,
  nextDespachoId,
  nextDestinoId,
  nextRutaId,
  nextTransportistaId,
} from '../src/logistics/infrastructure/logistics-aggregate.js'
import { toLocalizedText } from '../src/shared/infrastructure/seed-data-localized.js'

const SHIPMENTS_PATH = '/api/logistics/shipments'
const DESTINOS_PATH = '/api/logistics/destinos'
const CHOFERES_PATH = '/api/logistics/choferes'
const TRANSPORTISTAS_PATH = '/api/logistics/transportistas'

const ALLOWED_UI_STATUS = new Set(['transit', 'pending'])

const DEST_PRESETS = {
  ny: {
    currentTransit: { en: 'Interstate 95, Connecticut', es: 'Interestatal 95, Connecticut' },
    destTimeTransit: {
      en: 'Est. next business day — arrival',
      es: 'Est. siguiente día hábil — llegada',
    },
  },
  chicago: {
    currentTransit: { en: 'Near Indianapolis, IN', es: 'Cerca de Indianápolis, IN' },
    destTimeTransit: {
      en: 'Est. 36–48 h — arrival',
      es: 'Est. 36–48 h — llegada',
    },
  },
  seattle: {
    currentTransit: { en: 'In transit — Pacific Northwest corridor', es: 'En tránsito — corredor Noroeste' },
    destTimeTransit: {
      en: 'Est. 2–3 days — arrival',
      es: 'Est. 2–3 días — llegada',
    },
  },
  la: {
    currentTransit: { en: 'I-40 corridor, AZ', es: 'Corredor I-40, AZ' },
    destTimeTransit: {
      en: 'Est. 48 h — arrival',
      es: 'Est. 48 h — llegada',
    },
  },
  miami: {
    currentTransit: { en: 'Southeast distribution lane', es: 'Carril distribución sureste' },
    destTimeTransit: {
      en: 'Est. 24–72 h — arrival',
      es: 'Est. 24–72 h — llegada',
    },
  },
}

const GENERIC_DEST_PRESET = {
  currentTransit: { en: 'In transit', es: 'En tránsito' },
  destTimeTransit: {
    en: 'Est. per route — arrival',
    es: 'Est. según ruta — llegada',
  },
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      if (!chunks.length) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function readDb(dbFilePath) {
  return JSON.parse(fs.readFileSync(dbFilePath, 'utf8'))
}

function writeDb(dbFilePath, data) {
  fs.writeFileSync(dbFilePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function pathnameOnly(url) {
  if (!url) return '/'
  const q = url.indexOf('?')
  const p = q === -1 ? url : url.slice(0, q)
  return p.replace(/\/+/g, '/') || '/'
}

/** Alias UI → `rutas.codigo` en semilla (varias rutas al mismo destino). */
const RUTA_CODIGO_ALIASES = {
  chicago: 'chicago_sb',
  seattle: 'seattle_fz',
}

function findRutaByCodigo(rutas, codigo) {
  const resolved = RUTA_CODIGO_ALIASES[codigo] ?? codigo
  return rutas.find((r) => r.codigo === resolved)
}

const MAIN_WAREHOUSE_PLACE = toLocalizedText('t:places.main_warehouse')

/** Nombre localizado de un punto (código de destino creado, ruta predefinida o almacén). */
function resolvePlaceLocalized(codigoRaw, data) {
  const c = normalizeCodigo(String(codigoRaw ?? ''))
  if (!c) return { en: '—', es: '—' }
  if (c === 'main_warehouse') return { ...MAIN_WAREHOUSE_PLACE }
  ensureLogisticsCollections(data)
  const destinos = data.logistics.destinos
  const hitD = destinos.find((x) => normalizeCodigo(String(x.codigo ?? '')) === c)
  if (hitD?.nombre != null) {
    if (typeof hitD.nombre === 'string') {
      const s = hitD.nombre.trim()
      return s ? toLocalizedText(s) : { en: c, es: c }
    }
    return toLocalizedText(hitD.nombre)
  }
  const rutas = data.logistics.rutas
  const r = findRutaByCodigo(rutas, c)
  if (r?.destino) {
    const dest = r.destino
    if (typeof dest === 'string') {
      const s = dest.trim()
      return s ? toLocalizedText(s) : { en: c, es: c }
    }
    return toLocalizedText(dest)
  }
  return { en: c, es: c }
}

function findTransportistaByCodigo(transportistas, codigo) {
  return transportistas.find((t) => t.codigo === codigo)
}

function findChoferByCodigo(choferes, codigo) {
  const c = normalizeCodigo(codigo)
  if (!c) return undefined
  return choferes.find((x) => x.codigo === c)
}

function findChoferById(choferes, idChofer) {
  return choferes.find((c) => String(c.idChofer) === String(idChofer))
}

/** @param {string} pathname */
function choferIdPathMatch(pathname) {
  const prefix = `${CHOFERES_PATH}/`
  if (!pathname.startsWith(prefix)) return null
  const id = pathname.slice(prefix.length)
  if (!id || id.includes('/')) return null
  return decodeURIComponent(id)
}

/** @param {object[]} destinos @param {object[]} rutas */
function mergeDestinosWithRuta(destinos, rutas) {
  const rr = Array.isArray(rutas) ? rutas : []
  return destinos.map((d) => {
    const r = rr.find((rt) => rt.codigo === d.codigo)
    return {
      ...d,
      distanciaKm: r?.distanciaKm ?? null,
      tiempoEstimadoHoras: r?.tiempoEstimadoHoras ?? null,
      idRuta: r?.idRuta,
      rutaOrigen: r?.origen ?? null,
    }
  })
}

function findDestinoById(destinos, idDestino) {
  return destinos.find((d) => String(d.idDestino) === String(idDestino))
}

/** @param {string} pathname */
function destinoIdPathMatch(pathname) {
  const prefix = `${DESTINOS_PATH}/`
  if (!pathname.startsWith(prefix)) return null
  const id = pathname.slice(prefix.length)
  if (!id || id.includes('/')) return null
  return decodeURIComponent(id)
}

function findTransportistaById(transportistas, id) {
  return transportistas.find((t) => String(t.idTransportista) === String(id))
}

function ensureLogisticsCollections(data) {
  if (!data.logistics) data.logistics = {}
  if (!Array.isArray(data.logistics.transportistas)) data.logistics.transportistas = []
  if (!Array.isArray(data.logistics.rutas)) data.logistics.rutas = []
  if (!Array.isArray(data.logistics.despachos)) data.logistics.despachos = []
  if (!Array.isArray(data.logistics.destinos)) data.logistics.destinos = []
  if (!Array.isArray(data.logistics.choferes)) data.logistics.choferes = []
}

/** Código interno para la flota creada sola cuando la BD no tiene transportistas (p. ej. db vacío). */
const DEFAULT_FLEET_CODIGO = 'mi_flota'

/**
 * Inserta un transportista mínimo para poder dar de alta el primer chofer sin paso previo por “flota”.
 * @param {object[]} transportistas
 */
function ensureDefaultTransportista(transportistas) {
  if (transportistas.length > 0) return
  transportistas.push({
    idTransportista: nextTransportistaId(transportistas),
    nombre: { en: 'Default fleet', es: 'Flota predeterminada' },
    tipoVehiculo: { en: 'Refrigerated truck', es: 'Camión refrigerado' },
    contacto: '',
    codigo: DEFAULT_FLEET_CODIGO,
  })
}

/** @param {string} raw */
function normalizeCodigo(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

const CODIGO_RE = /^[a-z][a-z0-9_]{1,47}$/

/** @param {unknown} raw @param {unknown} [fallback] */
function normalizeChoferRol(raw, fallback = 'conductor') {
  const n = String(raw ?? '')
    .trim()
    .toLowerCase()
  if (n === 'operario') return 'operario'
  if (n === 'conductor') return 'conductor'
  const fb = String(fallback ?? 'conductor')
    .trim()
    .toLowerCase()
  return fb === 'operario' ? 'operario' : 'conductor'
}

/** Slug estable a partir del nombre (quita acentos, luego `normalizeCodigo`). */
function slugBaseFromNombre(raw) {
  const s = String(raw ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return normalizeCodigo(s)
}

/**
 * Código único para destino/ruta cuando el cliente solo envía el nombre.
 * @param {string} nombreRaw
 * @param {object[]} rutas
 * @param {object[]} destinos
 * @returns {string|null}
 */
function uniqueDestinoCodigoFromNombre(nombreRaw, rutas, destinos) {
  let base = slugBaseFromNombre(nombreRaw)
  if (!base) base = 'destino'
  if (!/^[a-z]/.test(base)) {
    base = normalizeCodigo(`d_${base}`)
  }
  if (!CODIGO_RE.test(base)) {
    base = `dest_${Date.now().toString(36).slice(-8)}`
  }
  let candidate = base.length > 48 ? base.slice(0, 48) : base
  candidate = normalizeCodigo(candidate)
  if (!CODIGO_RE.test(candidate)) candidate = 'destino_x'
  let n = 2
  while (rutas.some((r) => r.codigo === candidate) || destinos.some((d) => d.codigo === candidate)) {
    const suffix = `_${n}`
    const cut = Math.max(1, 48 - suffix.length)
    candidate = normalizeCodigo(String(base).slice(0, cut) + suffix)
    if (!CODIGO_RE.test(candidate)) {
      candidate = normalizeCodigo(`dest_${Date.now().toString(36)}_${n}`)
    }
    n += 1
    if (n > 2000) return null
  }
  return candidate
}

function pickTrimmed(...vals) {
  for (const v of vals) {
    if (typeof v !== 'string') continue
    const s = v.trim()
    if (s) return s
  }
  return ''
}

function tempTone(min, max) {
  const lo = Number(min)
  const hi = Number(max)
  if (Number.isNaN(lo) || Number.isNaN(hi)) return 'chilled'
  if (hi <= 0 || lo < -10) return 'frozen'
  return 'chilled'
}

/**
 * @param {string} dbFilePath
 */
export function createDevLogisticsApi(dbFilePath) {
  return function devLogisticsApi(req, res, next) {
    const pathname = pathnameOnly(req.url)

    if (pathname === DESTINOS_PATH && req.method === 'GET') {
      try {
        const data = readDb(dbFilePath)
        ensureLogisticsCollections(data)
        const merged = mergeDestinosWithRuta(data.logistics.destinos, data.logistics.rutas)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ destinos: merged }))
      } catch {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'DB read failed' }))
      }
      return
    }

    const destinoIdParam = destinoIdPathMatch(pathname)
    if (destinoIdParam && req.method === 'PUT') {
      readBody(req)
        .then((body) => {
          let data
          try {
            data = readDb(dbFilePath)
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'DB read failed' }))
            return
          }
          ensureLogisticsCollections(data)
          const { rutas, destinos } = data.logistics
          const dIdx = destinos.findIndex((d) => String(d.idDestino) === String(destinoIdParam))
          if (dIdx === -1) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'destino_not_found' }))
            return
          }
          const cur = destinos[dIdx]
          const oldCodigo = cur.codigo
          const rIdx = rutas.findIndex((r) => r.codigo === oldCodigo)
          const prevRuta = rIdx !== -1 ? rutas[rIdx] : null

          const nombreRaw = pickTrimmed(body.nombre, body.nombreEn, body.nombreEs)
          if (!nombreRaw) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'invalid_destino_fields' }))
            return
          }
          const nombreEn = pickTrimmed(body.nombreEn, body.nombre, body.nombreEs) || nombreRaw
          const nombreEs = pickTrimmed(body.nombreEs, body.nombre, body.nombreEn) || nombreRaw

          const nextCodigo =
            body.codigo !== undefined && body.codigo !== null && String(body.codigo).trim() !== ''
              ? normalizeCodigo(body.codigo)
              : cur.codigo
          if (!CODIGO_RE.test(nextCodigo)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'invalid_destino_fields' }))
            return
          }

          if (destinos.some((d, i) => i !== dIdx && d.codigo === nextCodigo)) {
            res.statusCode = 409
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'codigo_exists' }))
            return
          }
          if (rutas.some((r, j) => j !== rIdx && r.codigo === nextCodigo)) {
            res.statusCode = 409
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'codigo_exists' }))
            return
          }

          const origenSingle = pickTrimmed(body.origen, body.origenEn, body.origenEs)
          const defaultOrigen = 'Main warehouse'
          const defaultOrigenEs = 'Almacén principal'
          let origenEn
          let origenEs
          if (origenSingle) {
            origenEn = origenSingle
            origenEs = origenSingle
          } else if (prevRuta?.origen && typeof prevRuta.origen === 'object') {
            origenEn = prevRuta.origen.en ?? defaultOrigen
            origenEs = prevRuta.origen.es ?? defaultOrigenEs
          } else if (typeof prevRuta?.origen === 'string' && prevRuta.origen.trim()) {
            const o = prevRuta.origen.trim()
            origenEn = o
            origenEs = o
          } else {
            origenEn = defaultOrigen
            origenEs = defaultOrigenEs
          }
          const distanciaKm = Number.isFinite(Number(body.distanciaKm))
            ? Math.max(1, Math.floor(Number(body.distanciaKm)))
            : Math.max(1, Math.floor(Number(prevRuta?.distanciaKm ?? 1)))
          const tiempoEstimadoHoras = Number.isFinite(Number(body.tiempoEstimadoHoras))
            ? Math.max(1, Math.floor(Number(body.tiempoEstimadoHoras)))
            : Math.max(1, Math.floor(Number(prevRuta?.tiempoEstimadoHoras ?? 1)))

          destinos[dIdx] = {
            ...cur,
            codigo: nextCodigo,
            nombre: { en: nombreEn, es: nombreEs },
          }
          if (rIdx !== -1) {
            rutas[rIdx] = {
              ...rutas[rIdx],
              codigo: nextCodigo,
              origen: { en: origenEn, es: origenEs },
              destino: { en: nombreEn, es: nombreEs },
              distanciaKm,
              tiempoEstimadoHoras,
            }
          }

          try {
            writeDb(dbFilePath, data)
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'DB write failed' }))
            return
          }

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(mergeDestinosWithRuta([destinos[dIdx]], rutas)[0]))
        })
        .catch(() => {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Invalid JSON body' }))
        })
      return
    }

    if (destinoIdParam && req.method === 'DELETE') {
      try {
        const data = readDb(dbFilePath)
        ensureLogisticsCollections(data)
        const { rutas, destinos, despachos } = data.logistics
        const dIdx = destinos.findIndex((d) => String(d.idDestino) === String(destinoIdParam))
        if (dIdx === -1) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'destino_not_found' }))
          return
        }
        const codigo = destinos[dIdx].codigo
        const rIdx = rutas.findIndex((r) => r.codigo === codigo)
        const ruta = rIdx !== -1 ? rutas[rIdx] : null
        if (ruta && despachos.some((d) => String(d.idRuta) === String(ruta.idRuta))) {
          res.statusCode = 409
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'destino_in_use' }))
          return
        }
        destinos.splice(dIdx, 1)
        if (rIdx !== -1) rutas.splice(rIdx, 1)
        try {
          writeDb(dbFilePath, data)
        } catch {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'DB write failed' }))
          return
        }
        res.statusCode = 204
        res.end()
      } catch {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'DB read failed' }))
      }
      return
    }

    if (pathname === CHOFERES_PATH && req.method === 'GET') {
      try {
        const data = readDb(dbFilePath)
        ensureLogisticsCollections(data)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ choferes: data.logistics.choferes }))
      } catch {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'DB read failed' }))
      }
      return
    }

    const choferIdParam = choferIdPathMatch(pathname)
    if (choferIdParam && req.method === 'PUT') {
      readBody(req)
        .then((body) => {
          let data
          try {
            data = readDb(dbFilePath)
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'DB read failed' }))
            return
          }
          ensureLogisticsCollections(data)
          const { choferes } = data.logistics
          const idx = choferes.findIndex((c) => String(c.idChofer) === String(choferIdParam))
          if (idx === -1) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'chofer_not_found' }))
            return
          }
          const cur = choferes[idx]
          const nombreRaw = pickTrimmed(body.nombre, body.nombreEn, body.nombreEs)
          if (!nombreRaw) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'invalid_chofer_fields' }))
            return
          }
          const nombreEn = pickTrimmed(body.nombreEn, body.nombre, body.nombreEs) || nombreRaw
          const nombreEs = pickTrimmed(body.nombreEs, body.nombre, body.nombreEn) || nombreRaw
          const nextCodigo =
            body.codigo !== undefined && body.codigo !== null && String(body.codigo).trim() !== ''
              ? normalizeCodigo(body.codigo)
              : cur.codigo
          if (!CODIGO_RE.test(nextCodigo)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'invalid_chofer_fields' }))
            return
          }
          if (choferes.some((c, i) => i !== idx && c.codigo === nextCodigo)) {
            res.statusCode = 409
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'codigo_exists' }))
            return
          }
          const licencia =
            typeof body.licencia === 'string' && body.licencia.trim() ? body.licencia.trim() : ''
          const contacto =
            typeof body.contacto === 'string' && body.contacto.trim() ? body.contacto.trim() : ''
          const rol =
            body.rol !== undefined && body.rol !== null && String(body.rol).trim() !== ''
              ? normalizeChoferRol(body.rol)
              : normalizeChoferRol(cur.rol)
          choferes[idx] = {
            ...cur,
            codigo: nextCodigo,
            nombre: { en: nombreEn, es: nombreEs },
            licencia,
            contacto,
            rol,
          }
          try {
            writeDb(dbFilePath, data)
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'DB write failed' }))
            return
          }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(choferes[idx]))
        })
        .catch(() => {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Invalid JSON body' }))
        })
      return
    }

    if (choferIdParam && req.method === 'DELETE') {
      try {
        const data = readDb(dbFilePath)
        ensureLogisticsCollections(data)
        const { choferes, despachos } = data.logistics
        const idx = choferes.findIndex((c) => String(c.idChofer) === String(choferIdParam))
        if (idx === -1) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'chofer_not_found' }))
          return
        }
        const inUse = despachos.some(
          (d) =>
            String(d.idChofer) === String(choferIdParam) ||
            String(d.idOperario) === String(choferIdParam),
        )
        if (inUse) {
          res.statusCode = 409
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'chofer_in_use' }))
          return
        }
        choferes.splice(idx, 1)
        try {
          writeDb(dbFilePath, data)
        } catch {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'DB write failed' }))
          return
        }
        res.statusCode = 204
        res.end()
      } catch {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'DB read failed' }))
      }
      return
    }

    if (pathname === TRANSPORTISTAS_PATH && req.method === 'GET') {
      try {
        const data = readDb(dbFilePath)
        ensureLogisticsCollections(data)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ transportistas: data.logistics.transportistas }))
      } catch {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'DB read failed' }))
      }
      return
    }

    if (pathname === TRANSPORTISTAS_PATH && req.method === 'POST') {
      readBody(req)
        .then((body) => {
          const codigo = normalizeCodigo(body.codigo)
          const nombreStr = pickTrimmed(body.nombre, body.nombreEn, body.nombreEs)
          if (!codigo || !nombreStr || !CODIGO_RE.test(codigo)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'invalid_transportista_fields' }))
            return
          }

          let data
          try {
            data = readDb(dbFilePath)
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'DB read failed' }))
            return
          }

          ensureLogisticsCollections(data)
          const transportistas = data.logistics.transportistas
          if (transportistas.some((t) => t.codigo === codigo)) {
            res.statusCode = 409
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'codigo_exists' }))
            return
          }

          const tipoStr = pickTrimmed(body.tipoVehiculo, body.tipoVehiculoEn, body.tipoVehiculoEs)
          const tvEn = tipoStr || 'Refrigerated truck'
          const tvEs = tipoStr || 'Camión refrigerado'
          const contacto =
            typeof body.contacto === 'string' && body.contacto.trim() ? body.contacto.trim() : ''

          const row = {
            idTransportista: nextTransportistaId(transportistas),
            nombre: { en: nombreStr, es: nombreStr },
            tipoVehiculo: { en: tvEn, es: tvEs },
            contacto,
            codigo,
          }
          transportistas.push(row)

          try {
            writeDb(dbFilePath, data)
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'DB write failed' }))
            return
          }

          res.statusCode = 201
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(row))
        })
        .catch(() => {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Invalid JSON body' }))
        })
      return
    }

    if (pathname === DESTINOS_PATH && req.method === 'POST') {
      readBody(req)
        .then((body) => {
          const nombreRaw = pickTrimmed(body.nombre, body.nombreEn, body.nombreEs)
          const nombreEn = pickTrimmed(body.nombreEn, body.nombre, body.nombreEs) || nombreRaw
          const nombreEs = pickTrimmed(body.nombreEs, body.nombre, body.nombreEn) || nombreRaw
          if (!nombreRaw) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'invalid_destino_fields' }))
            return
          }

          let data
          try {
            data = readDb(dbFilePath)
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'DB read failed' }))
            return
          }

          ensureLogisticsCollections(data)
          const { rutas, destinos } = data.logistics

          const codigoFromBody = pickTrimmed(body.codigo)
          let codigo =
            codigoFromBody && CODIGO_RE.test(normalizeCodigo(codigoFromBody))
              ? normalizeCodigo(codigoFromBody)
              : uniqueDestinoCodigoFromNombre(nombreRaw, rutas, destinos)
          if (!codigo || !CODIGO_RE.test(codigo)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'invalid_destino_fields' }))
            return
          }

          if (rutas.some((r) => r.codigo === codigo) || destinos.some((d) => d.codigo === codigo)) {
            res.statusCode = 409
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'codigo_exists' }))
            return
          }

          const origenSingle = pickTrimmed(body.origen, body.origenEn, body.origenEs)
          const defaultOrigen = 'Main warehouse'
          const defaultOrigenEs = 'Almacén principal'
          const origenEn = origenSingle || defaultOrigen
          const origenEs = origenSingle || defaultOrigenEs
          const distanciaKm = Number.isFinite(Number(body.distanciaKm))
            ? Math.max(1, Math.floor(Number(body.distanciaKm)))
            : 1
          const tiempoEstimadoHoras = Number.isFinite(Number(body.tiempoEstimadoHoras))
            ? Math.max(1, Math.floor(Number(body.tiempoEstimadoHoras)))
            : 1

          const idDestino = nextDestinoId(destinos)
          const idRuta = nextRutaId(rutas)
          const destinoRow = {
            idDestino,
            codigo,
            nombre: { en: nombreEn, es: nombreEs },
          }
          const rutaRow = {
            idRuta,
            codigo,
            origen: { en: origenEn, es: origenEs },
            destino: { en: nombreEn, es: nombreEs },
            distanciaKm,
            tiempoEstimadoHoras,
          }

          destinos.push(destinoRow)
          rutas.push(rutaRow)

          try {
            writeDb(dbFilePath, data)
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'DB write failed' }))
            return
          }

          res.statusCode = 201
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(destinoRow))
        })
        .catch(() => {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Invalid JSON body' }))
        })
      return
    }

    if (pathname === CHOFERES_PATH && req.method === 'POST') {
      readBody(req)
        .then((body) => {
          const codigo = normalizeCodigo(body.codigo)
          const nombreRaw = pickTrimmed(body.nombre, body.nombreEn, body.nombreEs)
          const nombreEn = pickTrimmed(body.nombreEn, body.nombre, body.nombreEs) || nombreRaw
          const nombreEs = pickTrimmed(body.nombreEs, body.nombre, body.nombreEn) || nombreRaw
          const idTransportista = body.idTransportista
          if (!codigo || !nombreRaw || !CODIGO_RE.test(codigo)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'invalid_chofer_fields' }))
            return
          }

          let data
          try {
            data = readDb(dbFilePath)
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'DB read failed' }))
            return
          }

          ensureLogisticsCollections(data)
          const { transportistas, choferes } = data.logistics
          let idTransportistaResolved = idTransportista
          if (idTransportistaResolved == null || String(idTransportistaResolved).trim() === '') {
            idTransportistaResolved = transportistas[0]?.idTransportista
          }
          const noExplicitCarrier =
            idTransportista == null || String(idTransportista).trim() === ''
          if (
            (!idTransportistaResolved || !findTransportistaById(transportistas, idTransportistaResolved)) &&
            noExplicitCarrier &&
            transportistas.length === 0
          ) {
            ensureDefaultTransportista(transportistas)
            idTransportistaResolved = transportistas[0]?.idTransportista
          }
          if (!idTransportistaResolved || !findTransportistaById(transportistas, idTransportistaResolved)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'fleet_not_configured' }))
            return
          }
          if (choferes.some((c) => c.codigo === codigo)) {
            res.statusCode = 409
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'codigo_exists' }))
            return
          }

          const licencia =
            typeof body.licencia === 'string' && body.licencia.trim() ? body.licencia.trim() : ''
          const contacto =
            typeof body.contacto === 'string' && body.contacto.trim() ? body.contacto.trim() : ''
          const rol = normalizeChoferRol(body.rol)

          const chofer = {
            idChofer: nextChoferId(choferes),
            idTransportista: String(idTransportistaResolved).trim(),
            codigo,
            nombre: { en: nombreEn, es: nombreEs },
            licencia,
            contacto,
            rol,
          }
          choferes.push(chofer)

          try {
            writeDb(dbFilePath, data)
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'DB write failed' }))
            return
          }

          res.statusCode = 201
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(chofer))
        })
        .catch(() => {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Invalid JSON body' }))
        })
      return
    }

    if (pathname === SHIPMENTS_PATH && req.method === 'GET') {
      let data
      try {
        data = readDb(dbFilePath)
      } catch {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'DB read failed' }))
        return
      }
      const list = listLegacyShipmentsFromDb(data)
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ shipments: list }))
      return
    }

    if (pathname === SHIPMENTS_PATH && req.method === 'POST') {
      readBody(req)
        .then((body) => {
          const { inventoryItemId, qty, destinationKey, originKey, choferCodigo, operarioCodigo, carrierKey, status } =
            body
          if (
            inventoryItemId === undefined ||
            inventoryItemId === null ||
            String(inventoryItemId).trim() === ''
          ) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'inventoryItemId required' }))
            return
          }
          const driverCode = normalizeCodigo(String(choferCodigo ?? carrierKey ?? ''))
          const operatorCode = normalizeCodigo(String(operarioCodigo ?? ''))
          const destRouteKey = normalizeCodigo(String(destinationKey ?? ''))
          const originNorm = normalizeCodigo(String(originKey ?? ''))
          if (!driverCode && !operatorCode) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'choferCodigo_or_operarioCodigo_required' }))
            return
          }
          if (!ALLOWED_UI_STATUS.has(status)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Invalid status' }))
            return
          }

          let data
          try {
            data = readDb(dbFilePath)
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'DB read failed' }))
            return
          }

          const inventario = Array.isArray(data.inventory?.inventario) ? data.inventory.inventario : []
          const productos = Array.isArray(data.inventory?.productos) ? data.inventory.productos : []
          const rutas = Array.isArray(data.logistics?.rutas) ? data.logistics.rutas : []
          const transportistas = Array.isArray(data.logistics?.transportistas)
            ? data.logistics.transportistas
            : []
          const choferes = Array.isArray(data.logistics?.choferes) ? data.logistics.choferes : []
          let despachos = Array.isArray(data.logistics?.despachos) ? data.logistics.despachos : []

          const inv = inventario.find((r) => String(r.idInventario) === String(inventoryItemId))
          if (!inv) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'inventory_item_not_found' }))
            return
          }

          const prod = productos.find((p) => p.idProducto === inv.idProducto)
          if (!prod) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'product_not_found' }))
            return
          }

          const chDriver = driverCode ? findChoferByCodigo(choferes, driverCode) : null
          const chOp = operatorCode ? findChoferByCodigo(choferes, operatorCode) : null

          function personIsOperario(c) {
            if (!c) return false
            const r = String(c.rol ?? 'conductor')
              .trim()
              .toLowerCase()
            return r === 'operario' || r === 'operador'
          }

          if (chDriver && personIsOperario(chDriver)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'driver_must_not_be_operario_use_operator_field' }))
            return
          }
          if (operatorCode && chOp && !personIsOperario(chOp)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'operator_rol_invalid' }))
            return
          }
          if (operatorCode && !chOp) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'operator_not_found' }))
            return
          }

          let tr = null
          if (chDriver?.idTransportista) {
            tr = findTransportistaById(transportistas, chDriver.idTransportista)
          }
          if (!tr && driverCode) {
            tr = findTransportistaByCodigo(transportistas, driverCode)
          }
          if (!tr && chOp?.idTransportista) {
            tr = findTransportistaById(transportistas, chOp.idTransportista)
          }
          if (!tr) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'invalid_driver' }))
            return
          }

          const q = Math.floor(Number(qty))
          const maxQty = Math.max(Number(inv.cantidad) || 0, 1)
          if (!Number.isFinite(q) || q < 1 || q > maxQty) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'invalid_qty' }))
            return
          }

          const now = new Date()
          const eta = new Date(now.getTime() + 36 * 3600000)
          const domEstado = status === 'transit' ? 'en_transito' : 'pendiente'
          const thermal = prod.estado === 'en_riesgo' ? 'en_riesgo' : 'estable'
          let temperaturaActual = null
          if (status === 'transit') {
            if (thermal === 'en_riesgo') temperaturaActual = 8.6
            else if (tempTone(prod.temperaturaMin, prod.temperaturaMax) === 'frozen') {
              temperaturaActual = -18.5
            } else temperaturaActual = 2.1
          }

          const idDespacho = nextDespachoId(despachos)

          /** Sin destino: envío que permanece en almacén (sin ruta de salida). */
          let despacho
          if (!destRouteKey) {
            let whSpot = originNorm
              ? resolvePlaceLocalized(originKey, data)
              : { ...MAIN_WAREHOUSE_PLACE }
            if (whSpot.en === '—' && whSpot.es === '—') {
              whSpot = { ...MAIN_WAREHOUSE_PLACE }
            }
            despacho = {
              idDespacho,
              idInventario: inv.idInventario,
              idTransportista: tr.idTransportista,
              ...(chDriver ? { idChofer: chDriver.idChofer } : {}),
              ...(chOp ? { idOperario: chOp.idChofer } : {}),
              cantidad: q,
              fechaSalida: now.toISOString(),
              fechaEntregaEstimada: eta.toISOString(),
              estado: domEstado,
              estadoTermico: thermal,
              modoUbicacion: 'almacen',
              ubicacionAlmacen: { ...whSpot },
              destino: { ...whSpot },
              temperaturaActual,
              textos: {
                originPlace: { ...whSpot },
                destPlace: { ...whSpot },
                currentPlaceAlmacen: {
                  en:
                    status === 'transit'
                      ? 'On-site monitoring — warehouse storage'
                      : 'Awaiting handling — warehouse storage',
                  es:
                    status === 'transit'
                      ? 'Monitoreo en sitio — almacenaje'
                      : 'En espera — almacenaje en almacén',
                },
              },
            }
          } else {
            const ruta = findRutaByCodigo(rutas, destRouteKey)
            if (!ruta) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'invalid_destination_or_driver' }))
              return
            }
            const originPlace = resolvePlaceLocalized(originNorm ? originKey : 'main_warehouse', data)
            const destPlace = resolvePlaceLocalized(destinationKey, data)
            const preset = DEST_PRESETS[destRouteKey] ?? GENERIC_DEST_PRESET
            const textos = {
              originPlace: { ...originPlace },
              destPlace: { ...destPlace },
              currentPlace: { ...preset.currentTransit },
              destTime: { ...preset.destTimeTransit },
            }
            despacho = {
              idDespacho,
              idInventario: inv.idInventario,
              idTransportista: tr.idTransportista,
              ...(chDriver ? { idChofer: chDriver.idChofer } : {}),
              ...(chOp ? { idOperario: chOp.idChofer } : {}),
              idRuta: ruta.idRuta,
              cantidad: q,
              fechaSalida: now.toISOString(),
              fechaEntregaEstimada: eta.toISOString(),
              estado: domEstado,
              estadoTermico: thermal,
              destino: { ...destPlace },
              temperaturaActual,
              textos,
            }
          }

          inv.cantidad = Math.max(0, (Number(inv.cantidad) || 0) - q)
          if (status === 'transit') {
            prod.estado = 'en_transito'
          }

          despachos = [...despachos, despacho]
          if (!data.logistics) data.logistics = {}
          data.logistics.despachos = despachos
          data.inventory.inventario = inventario
          data.inventory.productos = productos

          try {
            writeDb(dbFilePath, data)
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'DB write failed' }))
            return
          }

          const legacy = listLegacyShipmentsFromDb(data).find((s) => s.id === idDespacho)
          res.statusCode = 201
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(legacy ?? { id: idDespacho }))
        })
        .catch(() => {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Invalid JSON body' }))
        })
      return
    }

    next()
  }
}
