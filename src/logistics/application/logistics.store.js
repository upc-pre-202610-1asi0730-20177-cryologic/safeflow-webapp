import { defineStore } from 'pinia'
import router from '@/router.js'
import { useInventoryStore } from '@/inventory/application/inventory.store.js'
import { useEnvironmentalMonitoringStore } from '@/environmental-monitoring/application/monitoring.store.js'
import { fetchLogisticsTracking, logisticsApi } from '../infrastructure/logistics-api.js'
import {
    applyWarehouseRoutePresentation,
    buildMockShipmentRecord,
    isMockShipmentsEndpoint,
    normalizeRouteKeysForShipment,
    resolvePlaceFromDestinos,
} from '../infrastructure/logistics-mock-shipments.js'
import { toLogisticsShipmentEntity } from '../infrastructure/logistics-shipment.assembler.js'
import { enrichShipmentDtoWithProduct } from '../presentation/use-shipment-monitor-card.js'

/** Un solo texto para MockAPI (sin guardar EN/ES en el recurso). */
function singleProductName(it) {
    if (!it) return '—'
    const n = it.name
    if (typeof n === 'string' && n.trim()) return n.trim()
    if (n && typeof n === 'object') return String(n.en ?? n.es ?? '').trim() || '—'
    return '—'
}

function singleCarrierName(ch, codeFallback) {
    if (!ch) return codeFallback || '—'
    const n = ch.nombre
    if (typeof n === 'string' && n.trim()) return n.trim()
    if (n && typeof n === 'object') return String(n.en ?? n.es ?? ch.codigo ?? '').trim() || String(ch.codigo ?? '—')
    return String(ch.codigo ?? codeFallback ?? '—')
}

export const useLogisticsStore = defineStore('logistics', {
    state: () => ({
        shipments: [],
        selectedId: 'S001',
    }),
    getters: {
        selectedShipment(state) {
            return state.shipments.find((s) => s.id === state.selectedId) ?? null
        },
    },
    actions: {
        async loadTracking() {
            const raw = await fetchLogisticsTracking()
            const invStore = useInventoryStore()
            if (!invStore.items.length) {
                try {
                    await invStore.loadItems()
                } catch {
                    /* inventario opcional para cruce idProducto */
                }
            }
            this.shipments = raw.shipments.map((dto) =>
                toLogisticsShipmentEntity(enrichShipmentDtoWithProduct(dto, invStore.items)),
            )
            if (!this.shipments.some((s) => s.id === this.selectedId)) {
                this.selectedId = this.shipments[0]?.id ?? ''
            }
        },
        selectShipment(id) {
            this.selectedId = id
        },
        newShipment() {
            return router.push({ name: 'logistics-add-shipment' })
        },
        /**
         * @param {{ inventoryItemId: string, qty: number, originKey: string|null, destinationKey: string|null, choferCodigo: string|null, operarioCodigo?: string|null, status: 'transit'|'pending' }} payload
         */
        async createShipment(payload) {
            let body = /** @type {Record<string, unknown>} */ (payload)
            if (isMockShipmentsEndpoint()) {
                const invStore = useInventoryStore()
                const it = invStore.items.find((x) => String(x.rowId) === String(payload.inventoryItemId))
                const productName = singleProductName(it)
                const [choferes, destinos] = await Promise.all([
                    logisticsApi.listChoferes(),
                    logisticsApi.listDestinos(),
                ])
                const code = String(payload.choferCodigo || payload.operarioCodigo || '').trim()
                const ch = choferes.find((c) => String(c.codigo) === code)
                const carrierName = singleCarrierName(ch, code)
                const keys = normalizeRouteKeysForShipment(payload.originKey, payload.destinationKey)
                const o = resolvePlaceFromDestinos(destinos, keys.originKey, 'origin')
                const d = resolvePlaceFromDestinos(destinos, keys.destinationKey, 'destination')
                const { originLabel, destLabel } = applyWarehouseRoutePresentation(o, d)
                body = buildMockShipmentRecord(
                    { ...payload, ...keys, idProducto: it?.idProducto ?? undefined },
                    {
                        productName,
                        carrierName,
                        originName: originLabel,
                        destinationName: destLabel,
                    },
                )
            }
            const created = await logisticsApi.createShipment(body)
            await this.loadTracking()
            if (created && created.id != null && String(created.id).trim() !== '') {
                this.selectedId = String(created.id)
            }
            await useEnvironmentalMonitoringStore().resyncFromServer()
            return created
        },
    },
})
