<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useInventoryStore } from '@/inventory/application/inventory.store.js'
import { useLogisticsStore } from '../../application/logistics.store.js'
import { logisticsApi } from '../../infrastructure/logistics-api.js'

const { t, locale } = useI18n()
const router = useRouter()
const toast = useToast()
const inventory = useInventoryStore()
const logistics = useLogisticsStore()

const inventoryItemId = ref(null)
const qty = ref(1)
const originKey = ref(null)
const destinationKey = ref(null)
const assignedStaffCodigo = ref(null)
const status = ref('transit')
const saving = ref(false)
/** @type {import('vue').Ref<{ label: string, value: string }[]>} */
const customDestinationOptions = ref([])
/** @type {import('vue').Ref<object[]>} */
const choferesFromApi = ref([])

/** Origen y destino: solo destinos persistidos en BD (formulario «Nuevo destino»), sin rutas de demo. */
const originOptions = computed(() => customDestinationOptions.value)
const destinationOptions = computed(() => customDestinationOptions.value)

/** Nombre visible; el valor del select es `codigo` del registro en `choferes`. */
function choferSelectLabel(ch) {
  const n = ch?.nombre
  if (typeof n === 'string' && n.trim()) return n.trim()
  if (n && typeof n === 'object') {
    const loc = locale.value === 'es' ? 'es' : 'en'
    const pick = n[loc] ?? n.en ?? n.es
    if (pick != null && String(pick).trim()) return String(pick).trim()
  }
  const fallback = String(ch?.codigo ?? '').trim()
  return fallback || '—'
}

function isOperarioRol(ch) {
  const r = String(ch?.rol ?? 'conductor')
      .trim()
      .toLowerCase()
  return r === 'operario' || r === 'operador'
}

/** Conductores y operarios en una sola lista; la etiqueta indica el rol. */
const staffOptions = computed(() => {
  const roleConductor = t('bounded.logistics.newShipmentForm.roleConductor')
  const roleOperario = t('bounded.logistics.newShipmentForm.roleOperario')
  const rows = choferesFromApi.value
      .filter((ch) => ch && typeof ch.codigo === 'string' && ch.codigo.length > 0)
      .map((ch) => ({
        label: `${choferSelectLabel(ch)} — ${isOperarioRol(ch) ? roleOperario : roleConductor}`,
        value: ch.codigo,
      }))
  return [...rows].sort((a, b) => a.label.localeCompare(b.label, locale.value === 'es' ? 'es' : 'en'))
})

const statusOptions = computed(() => [
  { label: t('bounded.logistics.shipmentStatus.transit'), value: 'transit' },
  { label: t('bounded.logistics.shipmentStatus.pending'), value: 'pending' },
])

const selectedItem = computed(() =>
    inventory.items.find((it) => String(it.rowId) === String(inventoryItemId.value)),
)

const itemOptions = computed(() =>
    inventory.items.map((it) => ({
      label: `${it.rowId} — ${it.name?.en ?? '—'}`,
      value: it.rowId,
      qty: it.qty,
    })),
)

watch(inventoryItemId, (id) => {
  const it = inventory.items.find((x) => String(x.rowId) === String(id))
  if (it && it.qty != null) {
    const max = Math.max(Number(it.qty) || 0, 1)
    qty.value = max
  }
})

async function loadCustomDestinations() {
  try {
    const list = await logisticsApi.listDestinos()
    const loc = locale.value === 'es' ? 'es' : 'en'
    customDestinationOptions.value = list.map((d) => {
      const n = d.nombre
      let name = String(d.codigo ?? '')
      if (n && typeof n === 'object') {
        name = String(n[loc] ?? n.en ?? n.es ?? d.codigo).trim() || name
      } else if (typeof n === 'string' && n.trim()) {
        name = n.trim()
      }
      return {
        label: `${name} (${d.codigo})`,
        value: d.codigo,
      }
    })
  } catch {
    customDestinationOptions.value = []
  }
}

watch(
    () => locale.value,
    () => {
      void loadCustomDestinations()
    },
)

async function loadChoferes() {
  try {
    choferesFromApi.value = await logisticsApi.listChoferes()
  } catch {
    choferesFromApi.value = []
  }
}

function reloadLists() {
  loadCustomDestinations()
  loadChoferes()
}

onMounted(() => {
  inventory.loadItems()
  reloadLists()
})

onActivated(() => {
  reloadLists()
})

const canSave = computed(() => {
  if (saving.value) return false
  if (!inventoryItemId.value || !status.value) {
    return false
  }
  if (!assignedStaffCodigo.value) {
    return false
  }
  const q = Number(qty.value)
  const max = selectedItem.value ? Math.max(Number(selectedItem.value.qty) || 0, 1) : 0
  return Number.isFinite(q) && q >= 1 && q <= max
})

async function submit() {
  if (!canSave.value) {
    toast.add({
      severity: 'warn',
      summary: t('bounded.logistics.newShipmentForm.cardTitle'),
      detail: t('bounded.logistics.newShipmentForm.validationError'),
      life: 4000,
    })
    return
  }
  saving.value = true
  try {
    const sel = choferesFromApi.value.find((c) => c.codigo === assignedStaffCodigo.value)
    const asOperario = sel && isOperarioRol(sel)
    await logistics.createShipment({
      inventoryItemId: String(inventoryItemId.value),
      qty: Math.floor(Number(qty.value)),
      originKey: originKey.value ?? null,
      destinationKey: destinationKey.value ?? null,
      choferCodigo: asOperario ? null : assignedStaffCodigo.value,
      operarioCodigo: asOperario ? assignedStaffCodigo.value : null,
      status: status.value,
    })
    toast.add({
      severity: 'success',
      summary: t('bounded.logistics.newShipmentForm.save'),
      detail: t('bounded.logistics.newShipmentForm.saveSuccess'),
      life: 4000,
    })
    router.push({ name: 'logistics-root' })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('bounded.logistics.newShipmentForm.save'),
      detail: t('bounded.logistics.newShipmentForm.saveError'),
      life: 6000,
    })
    console.warn(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="sf-lns sf-lns--light-form">
    <div class="sf-lns__card">
      <div class="sf-lns__card-head">
        <h3 class="sf-lns__title">{{ t('bounded.logistics.newShipmentForm.cardTitle') }}</h3>
        <p class="sf-lns__page-desc">{{ t('bounded.logistics.newShipmentForm.pageTitle') }}</p>
      </div>

      <div class="sf-lns__grid">
        <div class="sf-lns__field sf-lns__field--full">
          <label class="sf-lns__label" for="lns-product">{{ t('bounded.logistics.newShipmentForm.product') }}</label>
          <pv-select
              id="lns-product"
              v-model="inventoryItemId"
              class="sf-lns__input sf-lns__select"
              fluid
              :options="itemOptions"
              option-label="label"
              option-value="value"
              :placeholder="t('bounded.logistics.newShipmentForm.placeholder.select')"
          />
        </div>

        <p class="sf-lns__route-hint sf-lns__field--full">
          {{ t('bounded.logistics.newShipmentForm.routeHintShort') }}
        </p>

        <div class="sf-lns__field">
          <label class="sf-lns__label" for="lns-origin">{{ t('bounded.logistics.newShipmentForm.origin') }}</label>
          <pv-select
              id="lns-origin"
              v-model="originKey"
              class="sf-lns__input sf-lns__select"
              fluid
              show-clear
              :options="originOptions"
              option-label="label"
              option-value="value"
              :placeholder="t('bounded.logistics.newShipmentForm.placeholder.select')"
          />
        </div>

        <div class="sf-lns__field">
          <label class="sf-lns__label" for="lns-dest">{{ t('bounded.logistics.newShipmentForm.destination') }}</label>
          <pv-select
              id="lns-dest"
              v-model="destinationKey"
              class="sf-lns__input sf-lns__select"
              fluid
              show-clear
              :options="destinationOptions"
              option-label="label"
              option-value="value"
              :placeholder="t('bounded.logistics.newShipmentForm.placeholder.select')"
          />
        </div>

        <div class="sf-lns__field sf-lns__field--full">
          <label class="sf-lns__label" for="lns-staff">{{ t('bounded.logistics.newShipmentForm.staffAssignment') }}</label>
          <pv-select
              id="lns-staff"
              v-model="assignedStaffCodigo"
              class="sf-lns__input sf-lns__select"
              fluid
              show-clear
              :options="staffOptions"
              option-label="label"
              option-value="value"
              :placeholder="t('bounded.logistics.newShipmentForm.placeholder.select')"
          />
        </div>

        <div class="sf-lns__field sf-lns__field--full">
          <label class="sf-lns__label" for="lns-qty">{{ t('bounded.logistics.newShipmentForm.quantity') }}</label>
          <pv-input-number
              id="lns-qty"
              v-model="qty"
              class="sf-lns__input sf-lns__number"
              fluid
              :min="1"
              :max="selectedItem ? Math.max(Number(selectedItem.qty) || 0, 1) : undefined"
              :placeholder="t('bounded.inventory.newProduct.placeholder.quantity')"
          />
        </div>

        <div class="sf-lns__field sf-lns__field--full">
          <label class="sf-lns__label" for="lns-status">{{ t('bounded.logistics.newShipmentForm.initialStatus') }}</label>
          <pv-select
              id="lns-status"
              v-model="status"
              class="sf-lns__input sf-lns__select"
              fluid
              :options="statusOptions"
              option-label="label"
              option-value="value"
              :placeholder="t('bounded.logistics.newShipmentForm.placeholder.select')"
          />
        </div>
      </div>

      <div class="sf-lns__actions">
        <button type="button" class="sf-lns__cancel" @click="router.back()">
          {{ t('bounded.logistics.newShipmentForm.cancel') }}
        </button>
        <pv-button
            type="button"
            class="sf-lns__save"
            :label="t('bounded.logistics.newShipmentForm.save')"
            :disabled="!canSave"
            :loading="saving"
            @click="submit"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sf-lns {
  --sf-lns-border: #e5e7eb;
  --sf-lns-primary: #2563eb;
  --sf-lns-primary-hover: #1d4ed8;
  --sf-lns-text: var(--sf-ui-text);
  --sf-lns-muted: #64748b;
  --sf-lns-placeholder: #94a3b8;

  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 896px;
  margin: 0 auto;
}

.sf-lns--light-form {
  color-scheme: light;
  color: var(--sf-lns-text);
}

.sf-lns__card {
  background: #fff;
  border: 1px solid var(--sf-lns-border);
  border-radius: 12px;
  padding: 24px 28px 20px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.sf-lns__title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 700;
  color: var(--sf-lns-text);
  letter-spacing: -0.02em;
}

.sf-lns__card-head .sf-lns__title {
  margin: 0 0 6px;
}

.sf-lns__grid {
  display: grid;
  gap: 20px 24px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.sf-lns__field--full {
  grid-column: 1 / -1;
}

.sf-lns__label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  line-height: 1.3;
}

.sf-lns__route-hint {
  grid-column: 1 / -1;
  margin: 0 0 4px;
  padding: 6px 8px;
  font-size: clamp(11px, 0.72vw, 12.5px);
  font-weight: 400;
  color: var(--sf-lns-muted);
  line-height: 1.35;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e8edf3;
}

.sf-lns__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--sf-lns-border);
}

.sf-lns__cancel {
  border: 1px solid #cbd5e1;
  background: #fff;
  padding: 8px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  font-family: inherit;
  border-radius: 8px;
  transition:
      background 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease;
}

.sf-lns__cancel:hover {
  color: var(--sf-ui-text);
  background: #f8fafc;
  border-color: #94a3b8;
}

.sf-lns__save {
  background: var(--sf-lns-primary) !important;
  border-color: var(--sf-lns-primary) !important;
  color: #fff !important;
  padding-left: 20px !important;
  padding-right: 20px !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
}

.sf-lns__save:not(:disabled):hover {
  background: var(--sf-lns-primary-hover) !important;
  border-color: var(--sf-lns-primary-hover) !important;
}

.sf-lns__save:disabled {
  opacity: 0.55;
}

.sf-lns :deep(.p-inputtext),
.sf-lns :deep(.p-inputnumber-input) {
  background: #fff !important;
  color: var(--sf-lns-text) !important;
  border: 1px solid var(--sf-lns-border) !important;
  border-radius: 8px;
}

.sf-lns :deep(.p-inputnumber-input::placeholder) {
  color: var(--sf-lns-placeholder) !important;
}

.sf-lns :deep(.p-inputnumber.p-inputwrapper-focus .p-inputnumber-input) {
  border-color: #64748b !important;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.1);
}

.sf-lns :deep(.p-select) {
  background: #fff !important;
  border: 1px solid var(--sf-lns-border) !important;
  border-radius: 8px;
  box-shadow: none !important;
}

.sf-lns :deep(.p-select:not(.p-disabled):hover) {
  border-color: #cbd5e1 !important;
}

.sf-lns :deep(.p-select.p-focus) {
  border-color: #64748b !important;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.1);
}

.sf-lns :deep(.p-select-label) {
  color: var(--sf-lns-text) !important;
  background: transparent !important;
}

.sf-lns :deep(.p-select-label.p-placeholder) {
  color: var(--sf-lns-placeholder) !important;
}

.sf-lns :deep(.p-select-dropdown) {
  color: var(--sf-lns-muted) !important;
  background: transparent !important;
}

.sf-lns :deep(.p-inputtext:enabled:focus),
.sf-lns :deep(.p-inputnumber-input:enabled:focus) {
  border-color: #64748b !important;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.1);
}

@media (max-width: 720px) {
  .sf-lns__grid {
    grid-template-columns: 1fr;
  }

  .sf-lns__field--full {
    grid-column: 1;
  }

  .sf-lns__actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .sf-lns__cancel {
    text-align: center;
  }
}
</style>
