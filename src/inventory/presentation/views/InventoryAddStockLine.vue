<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { storeToRefs } from 'pinia'
import { useInventoryStore } from '../../application/inventory.store.js'

const { t, locale } = useI18n()
const router = useRouter()
const toast = useToast()
const inventory = useInventoryStore()
const { items } = storeToRefs(inventory)

const todayIso = () => new Date().toISOString().slice(0, 10)

const idProducto = ref(null)
const location = ref(null)
const quantity = ref(0)
/** @type {import('vue').Ref<HTMLInputElement | null>} */
const qtyInputRef = ref(null)
const fechaIngreso = ref(todayIso())
const saving = ref(false)

onMounted(() => {
  void inventory.loadItems()
})

function productLabel(item) {
  const pack = item?.name
  if (pack && typeof pack === 'object' && (pack.en != null || pack.es != null)) {
    const loc = locale.value === 'es' ? 'es' : 'en'
    return pack[loc] ?? pack.en ?? pack.es ?? ''
  }
  return item?.idProducto ?? ''
}

const productOptions = computed(() => {
  const byPid = new Map()
  for (const it of items.value) {
    if (!it?.idProducto) continue
    if (!byPid.has(it.idProducto)) {
      const name = productLabel(it)
      byPid.set(it.idProducto, {
        label: `${name} (${it.idProducto})`,
        value: it.idProducto,
      })
    }
  }
  return [...byPid.values()].sort((a, b) => a.label.localeCompare(b.label))
})

const locationOptions = computed(() => [
  { label: t('bounded.inventory.newProduct.location.mainWarehouse'), value: 'main' },
  { label: t('bounded.inventory.newProduct.location.freezer1'), value: 'freezer1' },
  { label: t('bounded.inventory.newProduct.location.coldRoom'), value: 'coldRoom' },
  { label: t('bounded.inventory.newProduct.location.sectorB'), value: 'sectorB' },
  { label: t('bounded.inventory.newProduct.location.almacenA'), value: 'almacen_a' },
  { label: t('bounded.inventory.newProduct.location.almacenB'), value: 'almacen_b' },
])

const canSave = computed(() => {
  if (saving.value) return false
  if (!idProducto.value || !location.value) return false
  if (quantity.value == null || Number.isNaN(Number(quantity.value))) return false
  if (typeof fechaIngreso.value !== 'string' || fechaIngreso.value.length < 8) return false
  return true
})

function resolvedQtyForSubmit() {
  const el = qtyInputRef.value
  if (el instanceof HTMLInputElement && el.type === 'number') {
    const n = el.valueAsNumber
    if (Number.isFinite(n)) return Math.max(0, Math.floor(n))
  }
  const v = Number(quantity.value)
  return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0
}

async function submit() {
  if (!canSave.value) {
    toast.add({
      severity: 'warn',
      summary: t('bounded.inventory.stockLine.cardTitle'),
      detail: t('bounded.inventory.stockLine.validationError'),
      life: 4000,
    })
    return
  }
  saving.value = true
  try {
    await inventory.addStockLine({
      idProducto: idProducto.value,
      location: location.value,
      qty: resolvedQtyForSubmit(),
      fechaIngreso: fechaIngreso.value,
    })
    toast.add({
      severity: 'success',
      summary: t('bounded.inventory.stockLine.save'),
      detail: t('bounded.inventory.stockLine.saveSuccess'),
      life: 4000,
    })
    router.push({ name: 'inventory-root' })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('bounded.inventory.stockLine.save'),
      detail: t('bounded.inventory.stockLine.saveError'),
      life: 6000,
    })
    console.warn(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="inv-page inv-page--light">
    <div v-if="!productOptions.length" class="inv-empty">
      <p class="inv-intro">{{ t('bounded.inventory.stockLine.pageTitle') }}</p>
      <p class="inv-callout">{{ t('bounded.inventory.stockLine.noProducts') }}</p>
    </div>

    <div v-else class="inv-card">
      <div class="inv-card-head">
        <h3 class="inv-title">{{ t('bounded.inventory.stockLine.cardTitle') }}</h3>
        <p class="inv-intro">{{ t('bounded.inventory.stockLine.pageTitle') }}</p>
      </div>

      <div class="inv-grid">
        <div class="inv-field inv-field-wide">
          <label class="inv-label" for="sl-product">{{ t('bounded.inventory.stockLine.product') }}</label>
          <pv-select
            id="sl-product"
            v-model="idProducto"
            class="inv-input-select"
            fluid
            :options="productOptions"
            option-label="label"
            option-value="value"
            :placeholder="t('bounded.inventory.newProduct.placeholder.select')"
          />
        </div>

        <div class="inv-field">
          <label class="inv-label" for="sl-loc">{{ t('bounded.inventory.table.location') }}</label>
          <pv-select
            id="sl-loc"
            v-model="location"
            class="inv-input-select"
            fluid
            :options="locationOptions"
            option-label="label"
            option-value="value"
            :placeholder="t('bounded.inventory.newProduct.placeholder.select')"
          />
        </div>

        <div class="inv-field">
          <label class="inv-label" for="sl-qty">{{ t('bounded.inventory.table.quantity') }}</label>
          <input
            id="sl-qty"
            ref="qtyInputRef"
            v-model.number="quantity"
            type="number"
            min="0"
            step="1"
            inputmode="numeric"
            class="inv-date"
            :placeholder="t('bounded.inventory.newProduct.placeholder.quantity')"
          />
        </div>

        <div class="inv-field">
          <label class="inv-label" for="sl-entry">{{ t('bounded.inventory.newProduct.fechaIngreso') }}</label>
          <input id="sl-entry" v-model="fechaIngreso" type="date" class="inv-date" />
        </div>
      </div>

      <div class="inv-actions">
        <button type="button" class="inv-btn-cancel" @click="router.back()">
          {{ t('bounded.inventory.newProduct.cancel') }}
        </button>
        <pv-button
          type="button"
          class="inv-btn-save"
          :label="t('bounded.inventory.stockLine.save')"
          :disabled="!canSave"
          :loading="saving"
          @click="submit"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.inv-page {
  --inv-border: #e5e7eb;
  --inv-primary: #3b82f6;
  --inv-primary-hover: #2563eb;
  --inv-text: var(--sf-ui-text);
  --inv-muted: #64748b;
  --inv-placeholder: #94a3b8;

  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 896px;
  margin: 0 auto;
}

.inv-page--light {
  color-scheme: light;
  color: var(--inv-text);
}

.inv-empty {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.inv-empty .inv-intro {
  margin: 0;
  font-size: 15px;
  font-weight: 400;
  line-height: 1.45;
  color: var(--inv-muted);
}

.inv-callout {
  margin: 0;
  padding: 16px 20px;
  border: 1px solid var(--inv-border);
  border-radius: 12px;
  background: #fff8f1;
  color: #9a3412;
  font-size: 15px;
}

.inv-card {
  background: #fff;
  border: 1px solid var(--inv-border);
  border-radius: 12px;
  padding: 24px 28px 20px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.inv-title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 700;
  color: var(--inv-text);
  letter-spacing: -0.02em;
}

.inv-grid {
  display: grid;
  gap: 20px 24px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.inv-field-wide {
  grid-column: 1 / -1;
}

.inv-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  line-height: 1.3;
}

.inv-date {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid var(--inv-border);
  border-radius: 8px;
  font-family: inherit;
  font-size: 15px;
  color: var(--inv-text);
  background: #fff;
}

.inv-date:focus {
  outline: none;
  border-color: #64748b;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.1);
}

.inv-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--inv-border);
}

.inv-btn-cancel {
  border: 1px solid var(--inv-border);
  background: #fff;
  padding: 8px 16px;
  font-size: 15px;
  font-weight: 500;
  color: var(--inv-muted);
  cursor: pointer;
  font-family: inherit;
  border-radius: 8px;
}

.inv-btn-cancel:hover {
  color: var(--inv-text);
  background: #f8fafc;
}

.inv-btn-save {
  background: var(--inv-primary) !important;
  border-color: var(--inv-primary) !important;
  color: #fff !important;
  padding-left: 20px !important;
  padding-right: 20px !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
}

.inv-btn-save:not(:disabled):hover {
  background: var(--inv-primary-hover) !important;
  border-color: var(--inv-primary-hover) !important;
}

.inv-btn-save:disabled {
  opacity: 0.55;
}

.inv-page :deep(.p-inputtext),
.inv-page :deep(.p-inputnumber-input) {
  background: #fff !important;
  color: var(--inv-text) !important;
  border: 1px solid var(--inv-border) !important;
  border-radius: 8px;
}

.inv-page :deep(.p-inputtext::placeholder),
.inv-page :deep(.p-inputnumber-input::placeholder) {
  color: var(--inv-placeholder) !important;
}

.inv-page :deep(.p-inputnumber.p-inputwrapper-focus .p-inputnumber-input) {
  border-color: #64748b !important;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.1);
}

.inv-page :deep(.p-select) {
  background: #fff !important;
  border: 1px solid var(--inv-border) !important;
  border-radius: 8px;
  box-shadow: none !important;
}

.inv-page :deep(.p-select:not(.p-disabled):hover) {
  border-color: #cbd5e1 !important;
}

.inv-page :deep(.p-select.p-focus) {
  border-color: #64748b !important;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.1);
}

.inv-page :deep(.p-select-label) {
  color: var(--inv-text) !important;
  background: transparent !important;
}

.inv-page :deep(.p-select-label.p-placeholder) {
  color: var(--inv-placeholder) !important;
}

.inv-page :deep(.p-select-dropdown) {
  color: var(--inv-muted) !important;
  background: transparent !important;
}

.inv-page :deep(.p-inputtext:enabled:focus),
.inv-page :deep(.p-inputnumber-input:enabled:focus) {
  border-color: #64748b !important;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.1);
}

@media (max-width: 720px) {
  .inv-grid {
    grid-template-columns: 1fr;
  }

  .inv-field-wide {
    grid-column: 1;
  }

  .inv-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .inv-btn-cancel {
    text-align: center;
  }
}
</style>
