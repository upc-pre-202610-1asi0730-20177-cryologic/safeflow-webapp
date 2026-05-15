/**
 * Store del contexto acotado Inventory (misma forma que publishing.store en learning-center).
 *
 * @module useInventoryStore
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { InventoryApi } from '../infrastructure/inventory-api.js'
import { InventoryItem } from '../domain/model/inventory-item.entity.js'
import { useEnvironmentalMonitoringStore } from '../../environmental-monitoring/application/monitoring.store.js'

const inventoryApi = new InventoryApi()

function refreshMonitoringAfterInventoryChange() {
  try {
    void useEnvironmentalMonitoringStore().resyncFromServer()
  } catch {
    /* Pinia fuera de contexto (p. ej. tests) */
  }
}

const useInventoryStore = defineStore('inventory', () => {
  /** @type {import('vue').Ref<InventoryItem[]>} */
  const items = ref([])
  /** @type {import('vue').Ref<unknown[]>} */
  const errors = ref([])

  async function loadItems() {
    try {
      items.value = await inventoryApi.list()
      errors.value = []
    } catch (e) {
      errors.value.push(e)
      items.value = []
    }
  }

  /**
   * @param {object} payload - Mismo contrato que {@link InventoryApi#create}.
   */
  async function createItem(payload) {
    await inventoryApi.create(payload)
    await loadItems()
    refreshMonitoringAfterInventoryChange()
  }

  /**
   * @param {{ idProducto: string, location: string, qty: number, fechaIngreso?: string }} payload
   */
  async function addStockLine(payload) {
    await inventoryApi.createStockLine(payload)
    await loadItems()
    refreshMonitoringAfterInventoryChange()
  }

  /** @param {object} item */
  async function updateItem(item) {
    const updated = await inventoryApi.update(item)
    const i = items.value.findIndex((x) => x.rowId === updated.rowId)
    if (i !== -1) items.value[i] = updated
    else await loadItems()
    return updated
  }

  /** @param {string|number} id */
  async function removeItem(id) {
    await inventoryApi.remove(id)
    items.value = items.value.filter((x) => String(x.rowId) !== String(id))
  }

  return {
    items,
    errors,
    loadItems,
    createItem,
    addStockLine,
    updateItem,
    removeItem,
  }
})

export { useInventoryStore }
export default useInventoryStore
