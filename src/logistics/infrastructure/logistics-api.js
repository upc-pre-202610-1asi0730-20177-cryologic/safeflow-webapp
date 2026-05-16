/**
 * Envíos: lista desde API de desarrollo (`/api/logistics/shipments`) o fallback a `db.json`.
 */

import db from '../../../server/db.json'
import { BaseApi } from '../../shared/infrastructure/base-api.js'
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js'
import { listLegacyShipmentsFromDb } from './logistics-aggregate.js'
import { isMockShipmentsEndpoint, mockRowToLegacyShipmentDto } from './logistics-mock-shipments.js'

const shipmentsEndpointPath =
    import.meta.env.VITE_LOGISTICS_SHIPMENTS_PATH || 'api/logistics/shipments'
const destinosEndpointPath = import.meta.env.VITE_LOGISTICS_DESTINOS_PATH || 'api/logistics/destinos'
const choferesEndpointPath = import.meta.env.VITE_LOGISTICS_CHOFERES_PATH || 'api/logistics/choferes'

/**
 * El middleware local devuelve `{ destinos: [...] }`; MockAPI suele devolver un array plano.
 * @param {unknown} data
 * @returns {object[]|null}
 */
function extractDestinosPayload(data) {
    if (data == null) return null
    if (Array.isArray(data)) return data
    if (typeof data === 'object' && Array.isArray(data.destinos)) return data.destinos
    return null
}

/**
 * MockAPI usa `id`; la UI usa `idDestino`. `codigo` hace falta para cruce con rutas (opcional en mock).
 * @param {object} row
 */
function normalizeDestinoRow(row) {
    const idDestino = row.idDestino != null ? row.idDestino : row.id
    const codigoRaw = row.codigo != null ? String(row.codigo).trim() : ''
    const slug =
        idDestino != null
            ? String(idDestino)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '') || 'x'
            : 'x'
    const codigo = codigoRaw || `d_${slug}`.slice(0, 48)
    return { ...row, idDestino, codigo }
}

/**
 * Middleware local: `{ choferes: [...] }`; MockAPI: array plano.
 * @param {unknown} data
 * @returns {object[]|null}
 */
function extractChoferesPayload(data) {
    if (data == null) return null
    if (Array.isArray(data)) return data
    if (typeof data === 'object' && Array.isArray(data.choferes)) return data.choferes
    return null
}

/**
 * MockAPI usa `id`; la UI usa `idChofer`. `idTransportista` opcional (mock sin flotas).
 * @param {object} row
 */
function normalizeChoferRow(row) {
    const idChofer = row.idChofer != null ? row.idChofer : row.id
    const idTransportista =
        row.idTransportista != null && String(row.idTransportista).trim()
            ? String(row.idTransportista).trim()
            : 'T1'
    const r = String(row.rol ?? 'conductor')
        .trim()
        .toLowerCase()
    const rol = r === 'operario' ? 'operario' : 'conductor'
    return { ...row, idChofer, idTransportista, rol }
}

/**
 * Middleware: `{ shipments: [...] }`; MockAPI: array plano.
 * @param {unknown} data
 * @returns {object[]|null}
 */
function extractShipmentsPayload(data) {
    if (data == null) return null
    if (Array.isArray(data)) return data
    if (typeof data === 'object' && Array.isArray(data.shipments)) return data.shipments
    return null
}

function staticShipments() {
    const merged = listLegacyShipmentsFromDb(db)
    if (merged.length) return merged
    const list = db?.logistics?.shipments
    return Array.isArray(list) && list.length ? list : null
}

/** @param {object[]} destinos @param {object[]} rutas */
function mergeDestinosWithRutaRows(destinos, rutas) {
    const d = Array.isArray(destinos) ? destinos : []
    const r = Array.isArray(rutas) ? rutas : []
    return d.map((row) => {
        const rt = r.find((x) => x.codigo === row.codigo)
        return {
            ...row,
            distanciaKm: rt?.distanciaKm ?? null,
            tiempoEstimadoHoras: rt?.tiempoEstimadoHoras ?? null,
            idRuta: rt?.idRuta,
            rutaOrigen: rt?.origen ?? null,
        }
    })
}

export class LogisticsApi extends BaseApi {
    /** @type {BaseEndpoint} */
    #shipments
    /** @type {BaseEndpoint} */
    #destinos
    /** @type {BaseEndpoint} */
    #choferes

    constructor() {
        super()
        this.#shipments = new BaseEndpoint(this, shipmentsEndpointPath)
        this.#destinos = new BaseEndpoint(this, destinosEndpointPath)
        this.#choferes = new BaseEndpoint(this, choferesEndpointPath)
    }

    /**
     * @returns {Promise<object[]>}
     */
    async listShipments() {
        try {
            const { data } = await this.#shipments.getAll()
            const list = extractShipmentsPayload(data)
            if (list) {
                if (isMockShipmentsEndpoint()) {
                    const destinos = await this.listDestinos()
                    return list.map((row) => mockRowToLegacyShipmentDto(row, destinos)).filter(Boolean)
                }
                if (data && Array.isArray(data.shipments)) return data.shipments
            }
        } catch (e) {
            console.warn('[logistics] API no disponible; usando db.json estático', e)
        }
        if (isMockShipmentsEndpoint()) return []
        return staticShipments() ?? []
    }

    /**
     * @param {Record<string, unknown>} body
     * @returns {Promise<object>}
     */
    async createShipment(body) {
        const { data } = await this.#shipments.create(body)
        if (isMockShipmentsEndpoint()) {
            const destinos = await this.listDestinos()
            return mockRowToLegacyShipmentDto(data, destinos) ?? data
        }
        return data
    }

    /**
     * @returns {Promise<object[]>}
     */
    async listDestinos() {
        try {
            const { data } = await this.#destinos.getAll()
            const list = extractDestinosPayload(data)
            if (list) {
                const normalized = list.filter((x) => x != null && typeof x === 'object').map(normalizeDestinoRow)
                return mergeDestinosWithRutaRows(normalized, [])
            }
        } catch (e) {
            console.warn('[logistics] GET api/logistics/destinos falló', e?.message)
        }
        try {
            const { data } = await this.http.get('api/inventory')
            const d = data?.logistics?.destinos
            const r = data?.logistics?.rutas
            if (Array.isArray(d)) return mergeDestinosWithRutaRows(d, r)
        } catch (e2) {
            console.warn('[logistics] Fallback GET api/inventory (destinos)', e2?.message)
        }
        return mergeDestinosWithRutaRows(db?.logistics?.destinos, db?.logistics?.rutas)
    }

    /**
     * @param {Record<string, unknown>} body
     * @returns {Promise<object>}
     */
    async createDestino(body) {
        const { data } = await this.#destinos.create(body)
        return data
    }

    /**
     * @param {string} idDestino
     * @param {Record<string, unknown>} body
     * @returns {Promise<object>}
     */
    async updateDestino(idDestino, body) {
        const { data } = await this.http.put(
            `${destinosEndpointPath}/${encodeURIComponent(idDestino)}`,
            body,
        )
        return data
    }

    /**
     * @param {string} idDestino
     * @returns {Promise<void>}
     */
    async deleteDestino(idDestino) {
        await this.http.delete(`${destinosEndpointPath}/${encodeURIComponent(idDestino)}`)
    }

    /**
     * @returns {Promise<object[]>}
     */
    async listChoferes() {
        try {
            const { data } = await this.#choferes.getAll()
            const list = extractChoferesPayload(data)
            if (list) {
                return list.filter((x) => x != null && typeof x === 'object').map(normalizeChoferRow)
            }
        } catch (e) {
            console.warn('[logistics] GET api/logistics/choferes falló', e?.message)
        }
        try {
            const { data } = await this.http.get('api/inventory')
            const c = data?.logistics?.choferes
            if (Array.isArray(c)) return c
        } catch (e2) {
            console.warn('[logistics] Fallback GET api/inventory (choferes)', e2?.message)
        }
        const c = db?.logistics?.choferes
        return Array.isArray(c) ? c : []
    }

    /**
     * @param {Record<string, unknown>} body
     * @returns {Promise<object>}
     */
    async createChofer(body) {
        const { data } = await this.#choferes.create(body)
        return data
    }

    /**
     * @param {string} idChofer
     * @param {Record<string, unknown>} body
     * @returns {Promise<object>}
     */
    async updateChofer(idChofer, body) {
        const { data } = await this.http.put(
            `${choferesEndpointPath}/${encodeURIComponent(idChofer)}`,
            body,
        )
        return data
    }

    /**
     * @param {string} idChofer
     * @returns {Promise<void>}
     */
    async deleteChofer(idChofer) {
        await this.http.delete(`${choferesEndpointPath}/${encodeURIComponent(idChofer)}`)
    }
}

const logisticsApi = new LogisticsApi()

/**
 * @returns {Promise<{ shipments: object[] }>}
 */
export async function fetchLogisticsTracking() {
    const shipments = await logisticsApi.listShipments()
    if (!shipments.length) {
        console.warn('[logistics] logistics.shipments vacío o ausente')
    }
    return { shipments }
}

export { logisticsApi }
