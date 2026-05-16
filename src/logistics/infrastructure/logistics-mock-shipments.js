/**
 * Demo: envíos contra MockAPI (sin middleware local).
 * Si `VITE_LOGISTICS_SHIPMENTS_PATH` no empieza por `api/`, se asume recurso REST en la misma base que MockAPI.
 *
 * En MockAPI **no** se guardan pares `*En`/`*Es`: un solo `productName`, `carrierName`, y códigos.
 */

const shipmentsEndpointPath =
    import.meta.env.VITE_LOGISTICS_SHIPMENTS_PATH || 'api/logistics/shipments'

export function isMockShipmentsEndpoint() {
    const p = String(shipmentsEndpointPath).trim()
    return p.length > 0 && !p.startsWith('api/')
}

/**
 * @param {{ inventoryItemId: string, qty: number, originKey: string|null, destinationKey: string|null, choferCodigo: string|null, operarioCodigo?: string|null, status: string }} payload
 * @param {{ productName: string, carrierName: string, originName: string, destinationName: string }} labels - textos simples (sin pares EN/ES en el recurso)
 */
export function buildMockShipmentRecord(payload, labels) {
    const keys = normalizeRouteKeysForShipment(payload.originKey, payload.destinationKey)
    return {
        inventoryItemId: String(payload.inventoryItemId ?? ''),
        idProducto:
            payload.idProducto != null && String(payload.idProducto).trim()
                ? String(payload.idProducto).trim()
                : undefined,
        qty: Math.max(1, Math.floor(Number(payload.qty) || 1)),
        status: payload.status === 'pending' ? 'pending' : 'transit',
        originCodigo: keys.originKey != null ? String(keys.originKey) : '',
        destinationCodigo: keys.destinationKey != null ? String(keys.destinationKey) : '',
        choferCodigo: payload.choferCodigo != null ? String(payload.choferCodigo) : '',
        operarioCodigo: payload.operarioCodigo != null ? String(payload.operarioCodigo) : '',
        productName: labels.productName,
        carrierName: labels.carrierName,
        originName: labels.originName,
        destinationName: labels.destinationName,
        createdAt: new Date().toISOString(),
    }
}

/** Mismo texto EN/ES para la entidad de dominio (solo presentación). */
function locSame(s) {
    const t = String(s ?? '').trim() || '—'
    return { en: t, es: t }
}

/**
 * Etiqueta legible desde un registro destino (MockAPI / middleware).
 * @param {object} d
 */
function pickDestinoLabel(d) {
    if (!d || typeof d !== 'object') return ''
    const n = d.nombre
    if (typeof n === 'string' && n.trim()) return n.trim()
    if (n && typeof n === 'object') return String(n.en ?? n.es ?? '').trim()
    for (const k of ['name', 'label', 'title']) {
        const v = d[k]
        if (typeof v === 'string' && v.trim()) return v.trim()
    }
    return ''
}

/**
 * @param {object[]} destinos
 * @param {string} key
 * @returns {object|null}
 */
function findDestinoByKey(destinos, key) {
    const k = String(key ?? '').trim()
    if (!k) return null
    return (
        destinos.find(
            (d) =>
                String(d.codigo ?? '') === k ||
                String(d.idDestino ?? '') === k ||
                String(d.id ?? '') === k,
        ) ?? null
    )
}

/**
 * Nombre para la ruta cruzando con destinos persistidos (MockAPI no guarda siempre `originName` en el envío).
 * @param {object[]} destinos
 * @param {unknown} codigoOrId
 * @param {'origin'|'destination'} role
 */
export function resolvePlaceFromDestinos(destinos, codigoOrId, role = 'destination') {
    const k = String(codigoOrId ?? '').trim()
    if (!k) return role === 'origin' ? 'Main warehouse' : '—'
    const list = Array.isArray(destinos) ? destinos : []
    const d = findDestinoByKey(list, k)
    if (!d) return k
    const label = pickDestinoLabel(d)
    return label || String(d.codigo ?? k).trim() || k
}

/**
 * Un solo destino persistido: a veces se elige solo en «origen». Regla: el sitio concreto va al destino; el origen queda vacío (almacén central en UI).
 * @param {unknown} originKey
 * @param {unknown} destinationKey
 * @returns {{ originKey: string|null, destinationKey: string|null }}
 */
export function normalizeRouteKeysForShipment(originKey, destinationKey) {
    const o = originKey != null && String(originKey).trim() !== '' ? String(originKey).trim() : ''
    const d = destinationKey != null && String(destinationKey).trim() !== '' ? String(destinationKey).trim() : ''
    if (o && !d) return { originKey: null, destinationKey: o }
    if (!o && d) return { originKey: null, destinationKey: d }
    if (o && d) return { originKey: o, destinationKey: d }
    return { originKey: null, destinationKey: null }
}

function stripDiacritics(s) {
    return String(s ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
}

/** Almacén central por nombre (EN/ES); usado solo para orden de presentación. */
function isMainWarehouseLabel(s) {
    const t = stripDiacritics(s)
    if (!t || t === '—') return false
    return (
        t === 'main warehouse' ||
        t === 'almacen principal' ||
        t === 'central warehouse' ||
        t === 'warehouse principal'
    )
}

/**
 * Convención de producto: salida desde almacén central hacia el sitio operativo.
 * Si quedó «sitio → almacén central», se invierte solo en pantalla.
 */
export function applyWarehouseRoutePresentation(originLabel, destLabel) {
    if (
        isMainWarehouseLabel(destLabel) &&
        !isMainWarehouseLabel(originLabel) &&
        originLabel !== '—' &&
        destLabel !== '—'
    ) {
        return { originLabel: destLabel, destLabel: originLabel }
    }
    return { originLabel, destLabel }
}

function formatDepartureMock(iso) {
    if (!iso) return locSame('—')
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return locSame(String(iso))
    const en = `${d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} — departure`
    const es = `${d.toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} — salida`
    return { en, es }
}

function formatEtaMock(iso, delivered) {
    if (!iso) return locSame('—')
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return locSame(String(iso))
    const prefixEn = delivered ? '' : 'Est. '
    const prefixEs = delivered ? '' : 'Est. '
    const suffixEn = delivered ? ' — completed' : ' — arrival'
    const suffixEs = delivered ? ' — completado' : ' — llegada'
    return {
        en: `${prefixEn}${d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}${suffixEn}`,
        es: `${prefixEs}${d.toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}${suffixEs}`,
    }
}

/**
 * Fila MockAPI → mismo shape que `listLegacyShipmentsFromDb` para `toLogisticsShipmentEntity`.
 * @param {object} row
 * @param {object[]|null} [destinos] - si se pasa, origen/destino se resuelven desde BD (MockAPI suele omitir `originName`/`destinationName` del esquema).
 */
export function mockRowToLegacyShipmentDto(row, destinos = null) {
    if (!row || typeof row !== 'object') return null
    const id = String(row.id ?? row.idDespacho ?? '').trim()
    if (!id) return null
    const qty = Math.max(0, Math.floor(Number(row.qty) || 0))
    const st = String(row.status ?? 'transit').toLowerCase()
    const delivered = st === 'delivered'
    const pending = st === 'pending'
    const routeStatus = delivered ? 'delivered' : pending ? 'pending' : 'transit'

    const pname =
        typeof row.productName === 'string' && row.productName.trim()
            ? row.productName.trim()
            : String(row.productEn ?? row.productLabelEn ?? '—').trim() || '—'
    const cname =
        typeof row.carrierName === 'string' && row.carrierName.trim()
            ? row.carrierName.trim()
            : String(row.carrierEn ?? row.carrierLabel ?? '—').trim() || '—'

    const productLine = `${pname} (${qty})`
    const product = locSame(productLine)
    const carrier = locSame(cname)
    const veh = '—'
    const providerLine = locSame(`${cname} • ${veh}`)

    const oc = String(row.originCodigo ?? '').trim() || '—'
    const dc = String(row.destinationCodigo ?? '').trim() || '—'
    const keys = normalizeRouteKeysForShipment(
        row.originCodigo != null && String(row.originCodigo).trim() ? row.originCodigo : null,
        row.destinationCodigo != null && String(row.destinationCodigo).trim() ? row.destinationCodigo : null,
    )
    let originLabel
    let destLabel
    if (Array.isArray(destinos) && destinos.length) {
        originLabel = resolvePlaceFromDestinos(destinos, keys.originKey, 'origin')
        destLabel = resolvePlaceFromDestinos(destinos, keys.destinationKey, 'destination')
        ;({ originLabel, destLabel } = applyWarehouseRoutePresentation(originLabel, destLabel))
    } else {
        originLabel =
            typeof row.originName === 'string' && row.originName.trim() ? row.originName.trim() : oc
        destLabel =
            typeof row.destinationName === 'string' && row.destinationName.trim()
                ? row.destinationName.trim()
                : dc
        ;({ originLabel, destLabel } = applyWarehouseRoutePresentation(originLabel, destLabel))
    }
    const routeFrom = locSame(originLabel)
    const routeTo = locSame(destLabel)

    const created = row.createdAt ? String(row.createdAt) : new Date().toISOString()
    const originTime = formatDepartureMock(created)
    const destTime = formatEtaMock(created, delivered)
    const currentPlace = pending
        ? locSame('Awaiting loading')
        : delivered
            ? { en: `Delivered — ${routeTo.en}`, es: `Entregado — ${routeTo.es}` }
            : locSame('In transit')
    const t =
        row.currentTemp != null && Number.isFinite(Number(row.currentTemp)) ? Number(row.currentTemp) : 2.1

    const choferCodigo =
        row.choferCodigo != null && String(row.choferCodigo).trim()
            ? String(row.choferCodigo).trim()
            : null
    const operarioCodigo =
        row.operarioCodigo != null && String(row.operarioCodigo).trim()
            ? String(row.operarioCodigo).trim()
            : null

    return {
        id,
        idDespacho: id,
        fechaSalida: created,
        idChofer: row.idChofer ?? null,
        choferCodigo,
        operarioCodigo,
        idInventario: row.inventoryItemId ?? row.idInventario ?? null,
        inventoryItemId: row.inventoryItemId ?? row.idInventario ?? null,
        idProducto: row.idProducto ?? null,
        status: routeStatus,
        thermal: row.thermal === 'risk' ? 'risk' : 'safe',
        currentTemp: t,
        product,
        carrier,
        providerLine,
        routeFrom,
        routeTo,
        placementKind: 'route',
        originPlace: routeFrom,
        originTime,
        currentPlace,
        destPlace: routeTo,
        destTime,
    }
}
