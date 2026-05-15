<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { Thermometer } from 'lucide-vue-next'
import { useInventoryStore } from '../../application/inventory.store.js'

const { t } = useI18n()
const router = useRouter()
const toast = useToast()
const inventory = useInventoryStore()

const todayIso = () => new Date().toISOString().slice(0, 10)

const productName = ref('')
const category = ref(null)
const tempMin = ref(null)
const tempMax = ref(null)
const quantity = ref(0)
/** @type {import('vue').Ref<HTMLInputElement | null>} */
const qtyInputRef = ref(null)
const location = ref(null)
const lote = ref('')
const fechaVencimiento = ref('')
const fechaIngreso = ref(todayIso())
const saving = ref(false)

const categoryOptions = computed(() => [
  { label: t('bounded.inventory.newProduct.category.medicine'), value: 'medicine' },
  { label: t('bounded.inventory.newProduct.category.food'), value: 'food' },
])

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
  const nameOk = productName.value.trim().length > 0
  const datesOk =
    typeof fechaVencimiento.value === 'string' &&
    fechaVencimiento.value.length >= 8 &&
    typeof fechaIngreso.value === 'string' &&
    fechaIngreso.value.length >= 8
  const numsOk =
    quantity.value != null &&
    !Number.isNaN(Number(quantity.value)) &&
    Number(quantity.value) >= 0 &&
    tempMin.value != null &&
    tempMax.value != null &&
    !Number.isNaN(Number(tempMin.value)) &&
    !Number.isNaN(Number(tempMax.value))
  return nameOk && category.value && location.value && numsOk && datesOk
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
      summary: t('bounded.inventory.newProduct.cardTitle'),
      detail: t('bounded.inventory.newProduct.validationError'),
      life: 4000,
    })
    return
  }
  saving.value = true
  try {
    await inventory.createItem({
      name: productName.value.trim(),
      category: category.value,
      qty: resolvedQtyForSubmit(),
      tempMin: tempMin.value,
      tempMax: tempMax.value,
      location: location.value,
      status: 'available',
      lote: lote.value.trim() || undefined,
      fechaVencimiento: fechaVencimiento.value,
      fechaIngreso: fechaIngreso.value,
    })
    toast.add({
      severity: 'success',
      summary: t('bounded.inventory.newProduct.save'),
      detail: t('bounded.inventory.newProduct.saveSuccess'),
      life: 4000,
    })
    router.push({ name: 'inventory-root' })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('bounded.inventory.newProduct.save'),
      detail: t('bounded.inventory.newProduct.saveError'),
      life: 6000,
    })
    console.warn(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <!-- PrimeVue sigue prefers-color-scheme: dark; forzamos look claro como el flujo de registro -->
  <div class="inv-page inv-page--light">
    <div class="inv-card">
      <div class="inv-card-head">
        <h3 class="inv-title">{{ t('bounded.inventory.newProduct.cardTitle') }}</h3>
        <p class="inv-intro">{{ t('bounded.inventory.newProduct.pageTitle') }}</p>
      </div>

      <div class="inv-grid">
        <div class="inv-field inv-field-wide">
          <label class="inv-label" for="np-name">{{ t('bounded.inventory.newProduct.productName') }}</label>
          <pv-input-text
            id="np-name"
            v-model="productName"
            class="inv-input"
            fluid
            :placeholder="t('bounded.inventory.newProduct.placeholder.name')"
          />
        </div>

        <div class="inv-field">
          <label class="inv-label" for="np-category">{{ t('bounded.inventory.table.category') }}</label>
          <pv-select
            id="np-category"
            v-model="category"
            class="inv-input-select"
            fluid
            :options="categoryOptions"
            option-label="label"
            option-value="value"
            :placeholder="t('bounded.inventory.newProduct.placeholder.select')"
          />
        </div>

        <div class="inv-field">
          <label class="inv-label" for="np-lote">{{ t('bounded.inventory.newProduct.lote') }}</label>
          <pv-input-text
            id="np-lote"
            v-model="lote"
            class="inv-input"
            fluid
            :placeholder="t('bounded.inventory.newProduct.placeholder.lote')"
          />
        </div>

        <div class="inv-field">
          <label class="inv-label" for="np-expiry">{{ t('bounded.inventory.newProduct.fechaVencimiento') }}</label>
          <input id="np-expiry" v-model="fechaVencimiento" type="date" class="inv-date" />
        </div>

        <div class="inv-field">
          <label class="inv-label" for="np-entry">{{ t('bounded.inventory.newProduct.fechaIngreso') }}</label>
          <input id="np-entry" v-model="fechaIngreso" type="date" class="inv-date" />
        </div>

        <div class="inv-field">
          <div class="inv-label-row">
            <label class="inv-label" for="np-tmin">{{ t('bounded.inventory.newProduct.tempMin') }}</label>
            <Thermometer class="inv-temp inv-temp-chilled" aria-hidden="true" />
          </div>
          <pv-input-number
            id="np-tmin"
            v-model="tempMin"
            class="inv-input-num"
            fluid
            :placeholder="t('bounded.inventory.newProduct.placeholder.temp')"
            suffix=" °C"
          />
        </div>

        <div class="inv-field">
          <div class="inv-label-row">
            <label class="inv-label" for="np-tmax">{{ t('bounded.inventory.newProduct.tempMax') }}</label>
            <Thermometer class="inv-temp inv-temp-frozen" aria-hidden="true" />
          </div>
          <pv-input-number
            id="np-tmax"
            v-model="tempMax"
            class="inv-input-num"
            fluid
            :placeholder="t('bounded.inventory.newProduct.placeholder.temp')"
            suffix=" °C"
          />
        </div>

        <div class="inv-field">
          <label class="inv-label" for="np-qty">{{ t('bounded.inventory.table.quantity') }}</label>
          <!-- `input type="number"` sincroniza en cada tecla; PrimeVue InputNumber suele actualizar el modelo al blur. -->
          <input
            id="np-qty"
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
          <label class="inv-label" for="np-loc">{{ t('bounded.inventory.table.location') }}</label>
          <pv-select
            id="np-loc"
            v-model="location"
            class="inv-input-select"
            fluid
            :options="locationOptions"
            option-label="label"
            option-value="value"
            :placeholder="t('bounded.inventory.newProduct.placeholder.select')"
          />
        </div>
      </div>

      <div class="inv-actions">
        <button type="button" class="inv-btn-cancel" @click="router.back()">
          {{ t('bounded.inventory.newProduct.cancel') }}
        </button>
        <pv-button
          type="button"
          class="inv-btn-save"
          :label="t('bounded.inventory.newProduct.save')"
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

.inv-label-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.inv-label-row .inv-label {
  margin-bottom: 0;
}

.inv-temp {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.inv-temp-chilled {
  color: #2563eb;
}

.inv-temp-frozen {
  color: #e11d48;
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

/* Anular tokens oscuros de PrimeVue (Material + prefers-color-scheme: dark) */
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
