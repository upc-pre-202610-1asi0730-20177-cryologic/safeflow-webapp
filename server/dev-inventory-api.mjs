/**
 * Middleware de desarrollo: `/api/inventory*` ↔ `db.json` → `inventory.productos` + `inventory.inventario`.
 */
import fs from 'node:fs'
import {
  joinProductoInventarioToLegacyItem,
  listLegacyItemsFromDb,
  nextInventarioId,
  nextProductoId,
  uiEstadoToProducto,
} from '../src/inventory/infrastructure/inventory-aggregate.js'

const ITEMS_PATH = '/api/inventory/items'
const STOCK_LINE_PATH = `${ITEMS_PATH}/stock-line`

const CATEGORY_STORE = {
  medicine: 't:productCategory.medicine',
  food: 't:productCategory.food',
}

const LOCATION_STORE = {
  main: 't:places.main_warehouse',
  freezer1: 't:places.freezer1',
  coldRoom: 't:places.coldRoom',
  sectorB: 't:places.sectorB',
  almacen_a: 't:places.almacen_a',
  almacen_b: 't:places.almacen_b',
}

const ALLOWED_STATUS = new Set(['available', 'risk', 'inactive', 'discarded', 'in_transit'])

/** @param {string} idProducto */
function defaultLoteForProductoId(idProducto) {
  const m = typeof idProducto === 'string' ? /(\d+)$/.exec(idProducto) : null
  const n = m ? parseInt(m[1], 10) : 1
  return `LOT-${String(n).padStart(3, '0')}`
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

function itemPathMatch(pathname) {
  const m = pathname.match(new RegExp(`^${ITEMS_PATH.replace(/\//g, '\\/')}\\/([^/]+)$`))
  return m ? m[1] : null
}

function ensureInventoryBuckets(data) {
  if (!data.inventory) data.inventory = {}
  if (!Array.isArray(data.inventory.productos)) data.inventory.productos = []
  if (!Array.isArray(data.inventory.inventario)) data.inventory.inventario = []
}

/**
 * @param {string} dbFilePath - Ruta absoluta a server/db.json
 */
export function createDevInventoryApi(dbFilePath) {
  return function devInventoryApi(req, res, next) {
    const pathname = pathnameOnly(req.url)

    if (pathname === '/api/inventory' && req.method === 'GET') {
      try {
        const data = readDb(dbFilePath)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
      } catch (e) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: String(e.message) }))
      }
      return
    }

    if (pathname === ITEMS_PATH && req.method === 'GET') {
      try {
        const data = readDb(dbFilePath)
        const items = listLegacyItemsFromDb(data)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ items }))
      } catch (e) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: String(e.message) }))
      }
      return
    }

    const itemId = itemPathMatch(pathname)
    if (itemId && req.method === 'GET') {
      try {
        const data = readDb(dbFilePath)
        const items = listLegacyItemsFromDb(data)
        const item = items.find((it) => String(it.id) === String(itemId))
        if (!item) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Not found' }))
          return
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(item))
      } catch (e) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: String(e.message) }))
      }
      return
    }

    if (itemId && req.method === 'DELETE') {
      try {
        const data = readDb(dbFilePath)
        ensureInventoryBuckets(data)
        const inventario = data.inventory.inventario
        const productos = data.inventory.productos
        const idx = inventario.findIndex((it) => String(it.idInventario) === String(itemId))
        if (idx === -1) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Not found' }))
          return
        }
        const pid = inventario[idx].idProducto
        inventario.splice(idx, 1)
        if (!inventario.some((row) => row.idProducto === pid)) {
          const pi = productos.findIndex((p) => p.idProducto === pid)
          if (pi !== -1) productos.splice(pi, 1)
        }
        writeDb(dbFilePath, data)
        res.statusCode = 204
        res.end()
      } catch (e) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: String(e.message) }))
      }
      return
    }

    if (itemId && req.method === 'PUT') {
      readBody(req)
        .then((body) => {
          if (!body || typeof body !== 'object') {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Invalid body' }))
            return
          }
          if (body.id != null && String(body.id) !== String(itemId)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'id mismatch' }))
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

          ensureInventoryBuckets(data)
          const inventario = data.inventory.inventario
          const productos = data.inventory.productos
          const inv = inventario.find((it) => String(it.idInventario) === String(itemId))
          if (!inv) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Not found' }))
            return
          }
          const prod = productos.find((p) => p.idProducto === inv.idProducto)
          if (!prod) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Not found' }))
            return
          }

          if (body.qty != null) inv.cantidad = Math.max(0, Math.floor(Number(body.qty)))
          if (body.location != null) {
            if (typeof body.location === 'object') {
              const en = String(body.location.en ?? '').trim()
              const es = String(body.location.es ?? '').trim()
              if (en || es) inv.ubicacion = en && es && en !== es ? { en, es } : en || es || inv.ubicacion
            } else if (typeof body.location === 'string' && body.location.trim()) {
              inv.ubicacion = body.location.trim()
            }
          }
          if (body.name != null) {
            if (typeof body.name === 'object') {
              const en = String(body.name.en ?? '').trim()
              const es = String(body.name.es ?? '').trim()
              if (en || es) prod.nombre = en && es && en !== es ? { en, es } : en || es || prod.nombre
            } else if (typeof body.name === 'string' && body.name.trim()) {
              prod.nombre = body.name.trim()
            }
          }
          if (body.category != null) {
            if (typeof body.category === 'object') {
              const en = String(body.category.en ?? '').trim()
              const es = String(body.category.es ?? '').trim()
              if (en || es) prod.categoria = en && es && en !== es ? { en, es } : en || es || prod.categoria
            } else if (typeof body.category === 'string' && body.category.trim()) {
              prod.categoria = body.category.trim()
            }
          }
          if (body.status != null) prod.estado = uiEstadoToProducto(body.status)
          if (body.temperaturaMin != null) prod.temperaturaMin = Number(body.temperaturaMin)
          if (body.temperaturaMax != null) prod.temperaturaMax = Number(body.temperaturaMax)
          if (body.lote != null) prod.lote = String(body.lote)
          if (body.fechaVencimiento != null) prod.fechaVencimiento = String(body.fechaVencimiento)

          try {
            writeDb(dbFilePath, data)
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'DB write failed' }))
            return
          }

          const updated = joinProductoInventarioToLegacyItem(inv, prod)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(updated))
        })
        .catch(() => {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Invalid JSON body' }))
        })
      return
    }

    if (pathname === STOCK_LINE_PATH && req.method === 'POST') {
      readBody(req)
        .then((body) => {
          const idProducto = typeof body.idProducto === 'string' ? body.idProducto.trim() : ''
          const { location, qty } = body
          if (!idProducto || !location || qty === undefined || qty === null) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing idProducto, location, or qty' }))
            return
          }

          const loc = LOCATION_STORE[location]
          if (!loc) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Invalid location' }))
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

          ensureInventoryBuckets(data)
          const productos = data.inventory.productos
          const inventario = data.inventory.inventario
          const prod = productos.find((p) => p.idProducto === idProducto)
          if (!prod) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'product_not_found' }))
            return
          }

          const ingresoStr =
            typeof body.fechaIngreso === 'string' && body.fechaIngreso.trim()
              ? body.fechaIngreso.trim().slice(0, 10)
              : new Date().toISOString().slice(0, 10)

          const inv = {
            idInventario: nextInventarioId(inventario),
            idProducto,
            cantidad: Math.max(0, Math.floor(Number(qty))),
            ubicacion: loc,
            fechaIngreso: ingresoStr,
          }
          inventario.push(inv)

          try {
            writeDb(dbFilePath, data)
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'DB write failed' }))
            return
          }

          const legacy = joinProductoInventarioToLegacyItem(inv, prod)
          res.statusCode = 201
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(legacy))
        })
        .catch(() => {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Invalid JSON body' }))
        })
      return
    }

    if (pathname === ITEMS_PATH && req.method === 'POST') {
      readBody(req)
        .then((body) => {
          const { name, category, qty, tempMin, tempMax, temperaturaMin, temperaturaMax, location, status } =
            body
          const nameStr = typeof name === 'string' ? name.trim() : ''
          const resolvedMin =
            temperaturaMin !== undefined && temperaturaMin !== null ? temperaturaMin : tempMin
          const resolvedMax =
            temperaturaMax !== undefined && temperaturaMax !== null ? temperaturaMax : tempMax
          if (
            !nameStr ||
            !category ||
            !location ||
            !status ||
            qty === undefined ||
            qty === null ||
            resolvedMin === undefined ||
            resolvedMin === null ||
            resolvedMax === undefined ||
            resolvedMax === null
          ) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing required fields' }))
            return
          }

          if (!ALLOWED_STATUS.has(status)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Invalid status' }))
            return
          }

          const cat = CATEGORY_STORE[category]
          const loc = LOCATION_STORE[location]
          if (!cat || !loc) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Invalid category or location' }))
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

          ensureInventoryBuckets(data)
          const productos = data.inventory.productos
          const inventario = data.inventory.inventario

          const tMin = Number(resolvedMin)
          const tMax = Number(resolvedMax)
          const prodId = nextProductoId(productos)
          const prod = {
            idProducto: prodId,
            nombre: nameStr,
            categoria: cat,
            temperaturaMin: tMin,
            temperaturaMax: tMax,
            fechaVencimiento:
              typeof body.fechaVencimiento === 'string' && body.fechaVencimiento.trim()
                ? body.fechaVencimiento.trim()
                : new Date().toISOString().slice(0, 10),
            lote:
              typeof body.lote === 'string' && body.lote.trim()
                ? body.lote.trim()
                : defaultLoteForProductoId(prodId),
            estado: uiEstadoToProducto(status),
          }

          const ingresoStr =
            typeof body.fechaIngreso === 'string' && body.fechaIngreso.trim()
              ? body.fechaIngreso.trim().slice(0, 10)
              : new Date().toISOString().slice(0, 10)

          const inv = {
            idInventario: nextInventarioId(inventario),
            idProducto: prod.idProducto,
            cantidad: Math.max(0, Math.floor(Number(qty))),
            ubicacion: loc,
            fechaIngreso: ingresoStr,
          }

          productos.push(prod)
          inventario.push(inv)

          try {
            writeDb(dbFilePath, data)
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'DB write failed' }))
            return
          }

          const legacy = joinProductoInventarioToLegacyItem(inv, prod)
          res.statusCode = 201
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(legacy))
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
