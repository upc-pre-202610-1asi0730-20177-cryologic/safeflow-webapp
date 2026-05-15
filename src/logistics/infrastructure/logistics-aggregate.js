import { toLocalizedText } from '../../shared/infrastructure/seed-data-localized.js'

/**
 * Agregación Logística: `despachos` + `transportistas` + `rutas` + inventario/producto
 * → filas compatibles con el panel de tracking (antes `shipments`).
 */

/** @param {string} e */
export function despachoEstadoToUi(e) {
    const m = { pendiente: 'pending', en_transito: 'transit', entregado: 'delivered' }
    return m[e] ?? 'pending'
}

/** @param {string} t */
export function estadoTermicoToUi(t) {
    return t === 'en_riesgo' ? 'risk' : 'safe'
}

/** @param {string} ui */
export function uiDespachoEstadoToDominio(ui) {
    const m = { pending: 'pendiente', transit: 'en_transito', delivered: 'entregado' }
    return m[ui] ?? 'pendiente'
}

function pickName(p) {
    return toLocalizedText(p?.nombre)
}

/** @param {unknown} p */
function pickLocalizedPlace(p) {
    const t = toLocalizedText(p)
    if (t.en === '—' && t.es === '—') return null
    return t
}

function formatDeparture(iso, localeHint) {
    if (!iso) return { en: '—', es: '—' }
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return { en: String(iso), es: String(iso) }
    return {
        en: `${d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} — departure`,
        es: `${d.toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} — salida`,
    }
}

function formatEta(iso, delivered) {
    if (!iso) return { en: '—', es: '—' }
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return { en: String(iso), es: String(iso) }
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
 * @param {object} db
 * @returns {object[]}
 */
export function listLegacyShipmentsFromDb(db) {
    const log = db?.logistics
    if (!log) return []

    if (Array.isArray(log.shipments) && log.shipments.length && !log.despachos) {
        return log.shipments
    }

    const transportistas = Array.isArray(log.transportistas) ? log.transportistas : []
    const choferes = Array.isArray(log.choferes) ? log.choferes : []
    const rutas = Array.isArray(log.rutas) ? log.rutas : []
    const despachos = Array.isArray(log.despachos) ? log.despachos : []
    const invRows = listInventario(db)
    const productos = Array.isArray(db?.inventory?.productos) ? db.inventory.productos : []

    const byT = new Map(transportistas.map((t) => [t.idTransportista, t]))
    const byCh = new Map(choferes.map((c) => [c.idChofer, c]))

    /** Primer chofer del transportista (envíos legacy sin `idChofer`). */
    function firstChoferForTransportista(idTransportista) {
        const id = String(idTransportista ?? '')
        if (!id) return null
        return choferes.find((c) => String(c.idTransportista) === id) ?? null
    }
    const byR = new Map(rutas.map((r) => [r.idRuta, r]))
    const byInv = new Map(invRows.map((i) => [i.idInventario, i]))
    const byProd = new Map(productos.map((p) => [p.idProducto, p]))

    return despachos.map((d) => {
        const tr = byT.get(d.idTransportista) ?? {}
        const rt = byR.get(d.idRuta) ?? {}
        const inv = byInv.get(d.idInventario)
        const prod = inv ? byProd.get(inv.idProducto) : null
        const nm = pickName(prod)
        const q = d.cantidad ?? inv?.cantidad ?? 0
        const product = {
            en: `${nm.en} (${q} units)`,
            es: `${nm.es} (${q} unidades)`,
        }
        const vehLoc = toLocalizedText(tr.tipoVehiculo)
        const vehEn = vehLoc.en
        const vehEs = vehLoc.es
        const legacyCh =
            !d.idChofer && !d.idOperario ? firstChoferForTransportista(d.idTransportista) : null
        const primaryPerson = d.idChofer ? byCh.get(d.idChofer) : legacyCh
        const opPerson = d.idOperario ? byCh.get(d.idOperario) : null
        const pName = primaryPerson ? pickName(primaryPerson) : null
        const oName = opPerson ? pickName(opPerson) : null
        let carrier
        if (pName && oName) {
            carrier = {
                en: `${pName.en} · ${oName.en}`,
                es: `${pName.es} · ${oName.es}`,
            }
        } else if (oName && !pName) {
            carrier = oName
        } else if (pName) {
            carrier = pName
        } else {
            carrier = pickName(tr)
        }
        const providerLine = {
            en: `${carrier.en} • ${vehEn ?? '—'}`,
            es: `${carrier.es} • ${vehEs ?? '—'}`,
        }
        const warehouseSpot = pickLocalizedPlace(d.ubicacionAlmacen)
        const placementKind = d.modoUbicacion === 'almacen' && warehouseSpot ? 'warehouse' : 'route'

        let routeFrom =
            pickLocalizedPlace(d.textos?.originPlace) ??
            pickLocalizedPlace(rt.origen) ?? { en: '—', es: '—' }
        let routeTo =
            pickLocalizedPlace(d.textos?.destPlace) ??
            pickLocalizedPlace(rt.destino) ??
            pickLocalizedPlace(d.destino) ?? { en: '—', es: '—' }

        if (placementKind === 'warehouse' && warehouseSpot) {
            routeFrom = warehouseSpot
            routeTo = warehouseSpot
        }

        const uiStatus = despachoEstadoToUi(d.estado)
        const delivered = d.estado === 'entregado'
        const pending = d.estado === 'pendiente'

        let destPlace = routeTo
        const originTime = d.textos?.originTime ?? formatDeparture(d.fechaSalida)
        let destTime = d.textos?.destTime ?? formatEta(d.fechaEntregaEstimada, delivered)
        let currentPlace =
            d.textos?.currentPlace ??
            (pending
                ? { en: 'Awaiting loading', es: 'En espera de carga' }
                : delivered
                    ? { en: `Delivered — ${destPlace.en}`, es: `Entregado — ${destPlace.es}` }
                    : { en: 'In transit', es: 'En tránsito' })

        if (placementKind === 'warehouse' && warehouseSpot) {
            destPlace = { en: '—', es: '—' }
            destTime = {
                en: 'No outbound route — stays in warehouse',
                es: 'Sin ruta de salida — permanece en almacén',
            }
            const cpWh = pickLocalizedPlace(d.textos?.currentPlaceAlmacen)
            currentPlace = cpWh ?? { en: 'Monitoring on site', es: 'Monitoreo en sitio' }
        }

        let currentTemp = d.temperaturaActual ?? null
        if (currentTemp == null && uiStatus === 'transit') {
            const thermal = estadoTermicoToUi(d.estadoTermico)
            currentTemp = thermal === 'risk' ? 8.6 : prod?.temperaturaMax != null && prod.temperaturaMax <= 0 ? -18.5 : 2.1
        }

        return {
            id: d.idDespacho,
            idDespacho: d.idDespacho,
            fechaSalida: d.fechaSalida ?? null,
            idChofer: d.idChofer ?? primaryPerson?.idChofer ?? null,
            choferCodigo: primaryPerson?.codigo ?? null,
            idInventario: d.idInventario,
            inventoryItemId: d.idInventario,
            idProducto: inv?.idProducto ?? null,
            status: uiStatus,
            thermal: estadoTermicoToUi(d.estadoTermico),
            currentTemp,
            product,
            carrier,
            providerLine,
            routeFrom,
            routeTo,
            placementKind,
            originPlace: routeFrom,
            originTime,
            currentPlace,
            destPlace,
            destTime,
        }
    })
}

function listInventario(db) {
    const invRoot = db?.inventory
    if (Array.isArray(invRoot?.inventario)) return invRoot.inventario
    return []
}

/**
 * @param {object[]} despachos
 */
export function nextDespachoId(despachos) {
    let max = 0
    for (const d of despachos) {
        const m = typeof d.idDespacho === 'string' ? /^S(\d+)$/.exec(d.idDespacho) : null
        if (m) max = Math.max(max, parseInt(m[1], 10))
    }
    return `S${String(max + 1).padStart(3, '0')}`
}

/**
 * @param {object[]} rutas
 * @returns {string}
 */
export function nextRutaId(rutas) {
    let max = 0
    for (const r of rutas) {
        const m = typeof r.idRuta === 'string' ? /^RT(\d+)$/i.exec(r.idRuta) : null
        if (m) max = Math.max(max, parseInt(m[1], 10))
    }
    return `RT${max + 1}`
}

/**
 * @param {object[]} destinos
 * @returns {string}
 */
export function nextDestinoId(destinos) {
    let max = 0
    for (const d of destinos) {
        const m = typeof d.idDestino === 'string' ? /^DST-(\d+)$/i.exec(d.idDestino) : null
        if (m) max = Math.max(max, parseInt(m[1], 10))
    }
    const n = max + 1
    return `DST-${String(n).padStart(3, '0')}`
}

/**
 * @param {object[]} choferes
 * @returns {string}
 */
export function nextChoferId(choferes) {
    let max = 0
    for (const c of choferes) {
        const m = typeof c.idChofer === 'string' ? /^DRV-(\d+)$/i.exec(c.idChofer) : null
        if (m) max = Math.max(max, parseInt(m[1], 10))
    }
    const n = max + 1
    return `DRV-${String(n).padStart(3, '0')}`
}

/**
 * @param {object[]} transportistas
 * @returns {string} p. ej. T5
 */
export function nextTransportistaId(transportistas) {
    let max = 0
    for (const t of transportistas) {
        const m = typeof t.idTransportista === 'string' ? /^T(\d+)$/i.exec(t.idTransportista) : null
        if (m) max = Math.max(max, parseInt(m[1], 10))
    }
    return `T${max + 1}`
}
