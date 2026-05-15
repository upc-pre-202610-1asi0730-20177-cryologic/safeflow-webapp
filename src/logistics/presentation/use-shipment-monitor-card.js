/**
 * Cruza un envío de logística con las tarjetas del store de monitoreo (misma lectura en °C).
 *
 * @param {object|null|undefined} shipment
 * @param {object[]} monitorCards
 * @returns {object|null}
 */
export function findMonitorCardForShipment(shipment, monitorCards) {
    if (!shipment || !Array.isArray(monitorCards) || !monitorCards.length) return null

    const sid = shipment.id != null ? String(shipment.id).trim() : ''
    if (sid) {
        const byShipment = monitorCards.find((c) => c.id === `ship-${sid}`)
        if (byShipment) return byShipment
    }

    const invKey = String(shipment.idInventario ?? shipment.inventoryItemId ?? '').trim()
    if (invKey) {
        const byInv = monitorCards.find((c) => String(c.idInventario ?? '').trim() === invKey)
        if (byInv) return byInv
    }

    const pid = shipment.idProducto != null ? String(shipment.idProducto).trim() : ''
    if (pid) {
        return monitorCards.find((c) => String(c.idProducto ?? '') === pid) ?? null
    }

    return null
}

/**
 * @param {object} shipment
 * @param {import('@/inventory/domain/model/inventory-item.entity.js').InventoryItem[]} inventoryItems
 * @returns {object}
 */
export function enrichShipmentDtoWithProduct(shipment, inventoryItems) {
    if (!shipment || typeof shipment !== 'object') return shipment
    if (shipment.idProducto != null && String(shipment.idProducto).trim()) return shipment

    const invKey = String(shipment.idInventario ?? shipment.inventoryItemId ?? '').trim()
    if (!invKey || !Array.isArray(inventoryItems)) return shipment

    const row = inventoryItems.find(
        (it) =>
            String(it.rowId ?? '') === invKey ||
            String(it.idInventario ?? '') === invKey ||
            String(it.rowId ?? '') === String(shipment.inventoryItemId ?? ''),
    )
    if (row?.idProducto) return { ...shipment, idProducto: row.idProducto }
    return shipment
}
