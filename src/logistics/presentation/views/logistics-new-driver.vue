<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { logisticsApi } from '../../infrastructure/logistics-api.js'

const { t, locale } = useI18n()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const choferes = ref([])
const editingId = ref(null)
const codigo = ref('')
const nombre = ref('')
const licencia = ref('')
const contacto = ref('')
/** @type {import('vue').Ref<'conductor' | 'operario'>} */
const rol = ref('conductor')
const saving = ref(false)

const rolOptions = computed(() => [
  { label: t('bounded.logistics.newDriverForm.rolConductor'), value: 'conductor' },
  { label: t('bounded.logistics.newDriverForm.rolOperario'), value: 'operario' },
])

function nombreDisplay(ch) {
  const n = ch?.nombre
  if (typeof n === 'string' && n.trim()) return n.trim()
  if (n && typeof n === 'object') {
    const loc = locale.value === 'es' ? 'es' : 'en'
    return String(n[loc] ?? n.en ?? n.es ?? '').trim() || '—'
  }
  return '—'
}

function nombreToFormField(ch) {
  const n = ch?.nombre
  if (typeof n === 'string') return n.trim()
  if (n && typeof n === 'object') {
    const loc = locale.value === 'es' ? 'es' : 'en'
    return String(n[loc] ?? n.en ?? n.es ?? '').trim()
  }
  return ''
}

function rolDisplay(ch) {
  const r = String(ch?.rol ?? 'conductor')
      .trim()
      .toLowerCase()
  return r === 'operario'
      ? t('bounded.logistics.newDriverForm.rolOperario')
      : t('bounded.logistics.newDriverForm.rolConductor')
}

async function loadChoferes() {
  try {
    choferes.value = await logisticsApi.listChoferes()
  } catch {
    choferes.value = []
  }
}

onMounted(() => {
  loadChoferes()
})

onActivated(() => {
  loadChoferes()
})

watch(rol, (next) => {
  if (next === 'operario') licencia.value = ''
})

const canSave = computed(() => {
  if (saving.value) return false
  const c = codigo.value.trim().toLowerCase()
  const codeOk = /^[a-z][a-z0-9_]{1,47}$/.test(c)
  return codeOk && nombre.value.trim().length > 0
})

const saveLabel = computed(() =>
    editingId.value ? t('bounded.logistics.newDriverForm.updateSave') : t('bounded.logistics.newDriverForm.save'),
)

function resetForm() {
  editingId.value = null
  codigo.value = ''
  nombre.value = ''
  licencia.value = ''
  contacto.value = ''
  rol.value = 'conductor'
}

function startEdit(ch) {
  editingId.value = ch.idChofer
  codigo.value = String(ch.codigo ?? '')
  nombre.value = nombreToFormField(ch)
  licencia.value = typeof ch.licencia === 'string' ? ch.licencia : ''
  contacto.value = typeof ch.contacto === 'string' ? ch.contacto : ''
  const r = String(ch?.rol ?? 'conductor')
      .trim()
      .toLowerCase()
  rol.value = r === 'operario' ? 'operario' : 'conductor'
}

function rowClassForDriver(data) {
  if (editingId.value != null && String(editingId.value) === String(data?.idChofer)) {
    return 'sf-ldrv__row--editing'
  }
  return ''
}

async function submit() {
  if (!canSave.value) {
    toast.add({
      severity: 'warn',
      summary: t('bounded.logistics.newDriverForm.cardTitle'),
      detail: t('bounded.logistics.newDriverForm.validationError'),
      life: 4000,
    })
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await logisticsApi.updateChofer(String(editingId.value), {
        codigo: codigo.value.trim().toLowerCase(),
        nombre: nombre.value.trim(),
        licencia: licencia.value.trim() || undefined,
        contacto: contacto.value.trim() || undefined,
        rol: rol.value,
      })
      toast.add({
        severity: 'success',
        summary: t('bounded.logistics.newDriverForm.updateSave'),
        detail: t('bounded.logistics.newDriverForm.updateSuccess'),
        life: 4000,
      })
    } else {
      await logisticsApi.createChofer({
        codigo: codigo.value.trim().toLowerCase(),
        nombre: nombre.value.trim(),
        licencia: licencia.value.trim() || undefined,
        contacto: contacto.value.trim() || undefined,
        rol: rol.value,
      })
      toast.add({
        severity: 'success',
        summary: t('bounded.logistics.newDriverForm.save'),
        detail: t('bounded.logistics.newDriverForm.saveSuccess'),
        life: 4000,
      })
    }
    await loadChoferes()
    resetForm()
  } catch (e) {
    const code = e?.response?.data?.error
    let detail = editingId.value
        ? t('bounded.logistics.newDriverForm.updateError')
        : t('bounded.logistics.newDriverForm.saveError')
    if (code === 'codigo_exists') detail = t('bounded.logistics.newDriverForm.errorCodigoExists')
    if (!editingId.value && code === 'fleet_not_configured') {
      detail = t('bounded.logistics.newDriverForm.errorFleet')
    }
    toast.add({
      severity: 'error',
      summary: editingId.value
          ? t('bounded.logistics.newDriverForm.updateSave')
          : t('bounded.logistics.newDriverForm.save'),
      detail,
      life: 6000,
    })
    console.warn(e)
  } finally {
    saving.value = false
  }
}

function requestDelete(ch) {
  const name = nombreDisplay(ch)
  confirm.require({
    header: t('bounded.logistics.newDriverForm.deleteHeader'),
    message: t('bounded.logistics.newDriverForm.deleteMessage', {
      name,
      code: ch.codigo ?? '',
    }),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => void doDelete(ch),
  })
}

async function doDelete(ch) {
  try {
    await logisticsApi.deleteChofer(String(ch.idChofer))
    if (editingId.value === ch.idChofer) resetForm()
    await loadChoferes()
    toast.add({
      severity: 'success',
      summary: t('bounded.logistics.newDriverForm.delete'),
      detail: t('bounded.logistics.newDriverForm.deleteSuccess'),
      life: 3500,
    })
  } catch (e) {
    const code = e?.response?.data?.error
    const detail =
        code === 'chofer_in_use'
            ? t('bounded.logistics.newDriverForm.deleteBlocked')
            : t('bounded.logistics.newDriverForm.deleteError')
    toast.add({
      severity: 'error',
      summary: t('bounded.logistics.newDriverForm.delete'),
      detail,
      life: 6000,
    })
    console.warn(e)
  }
}
</script>

<template>
  <div class="sf-ldrv sf-ldrv--light-form">
    <div class="sf-ldrv__layout">
      <div class="sf-ldrv__card">
        <div class="sf-ldrv__card-head">
          <div class="sf-ldrv__card-head-text">
            <h3 class="sf-ldrv__title">{{ t('bounded.logistics.newDriverForm.cardTitle') }}</h3>
            <p class="sf-ldrv__page-desc">{{ t('bounded.logistics.newDriverForm.pageTitle') }}</p>
          </div>
          <pv-button
              v-if="editingId"
              type="button"
              severity="secondary"
              outlined
              size="small"
              :label="t('bounded.logistics.newDriverForm.cancelEdit')"
              @click="resetForm"
          />
        </div>

        <div class="sf-ldrv__grid">
          <div class="sf-ldrv__field">
            <label class="sf-ldrv__label" for="ldrv-code">{{ t('bounded.logistics.newDriverForm.codigo') }}</label>
            <pv-input-text
                id="ldrv-code"
                v-model="codigo"
                class="sf-ldrv__input"
                fluid
                autocomplete="off"
                :placeholder="t('bounded.logistics.newDriverForm.codigoPlaceholder')"
            />
            <p class="sf-ldrv__hint">{{ t('bounded.logistics.newDriverForm.codigoHint') }}</p>
          </div>

          <div class="sf-ldrv__field sf-ldrv__field--full">
            <label class="sf-ldrv__label" for="ldrv-nombre">{{ t('bounded.logistics.newDriverForm.nombre') }}</label>
            <pv-input-text id="ldrv-nombre" v-model="nombre" class="sf-ldrv__input" fluid />
          </div>

          <div class="sf-ldrv__field sf-ldrv__field--full">
            <label class="sf-ldrv__label" for="ldrv-rol">{{ t('bounded.logistics.newDriverForm.rol') }}</label>
            <pv-select
                id="ldrv-rol"
                v-model="rol"
                class="sf-ldrv__input sf-ldrv__select"
                fluid
                :options="rolOptions"
                option-label="label"
                option-value="value"
            />
          </div>

          <div v-if="rol === 'conductor'" class="sf-ldrv__field">
            <label class="sf-ldrv__label" for="ldrv-lic">{{ t('bounded.logistics.newDriverForm.licencia') }}</label>
            <pv-input-text id="ldrv-lic" v-model="licencia" class="sf-ldrv__input" fluid />
            <p class="sf-ldrv__hint">{{ t('bounded.logistics.newDriverForm.licenciaHint') }}</p>
          </div>

          <div :class="['sf-ldrv__field', rol === 'operario' ? 'sf-ldrv__field--full' : '']">
            <label class="sf-ldrv__label" for="ldrv-tel">{{ t('bounded.logistics.newDriverForm.contacto') }}</label>
            <pv-input-text id="ldrv-tel" v-model="contacto" class="sf-ldrv__input" fluid />
          </div>
        </div>

        <div class="sf-ldrv__actions">
          <button type="button" class="sf-ldrv__cancel" @click="router.back()">
            {{ t('bounded.logistics.newDriverForm.cancel') }}
          </button>
          <pv-button
              type="button"
              class="sf-ldrv__save"
              :label="saveLabel"
              :disabled="!canSave"
              :loading="saving"
              @click="submit"
          />
        </div>
      </div>

      <div class="sf-ldrv__card sf-ldrv__card--list">
        <p v-if="!choferes.length" class="sf-ldrv__empty">{{ t('bounded.logistics.newDriverForm.listEmpty') }}</p>
        <div v-else class="sf-ldrv__table-shell">
          <div class="sf-ldrv__table-wrap">
            <pv-data-table
                :value="choferes"
                data-key="idChofer"
                striped-rows
                row-hover
                class="sf-ldrv__table"
                :table-style="{ width: '100%' }"
                :row-class="rowClassForDriver"
            >
              <pv-column :header="t('bounded.logistics.newDriverForm.colCodigo')" style="width: 13%">
                <template #body="{ data }">
                  <span class="sf-ldrv__cell-code">{{ data.codigo ?? '—' }}</span>
                </template>
              </pv-column>
              <pv-column :header="t('bounded.logistics.newDriverForm.colNombre')" style="width: 22%">
                <template #body="{ data }">
                  <span class="sf-ldrv__cell-text">{{ nombreDisplay(data) }}</span>
                </template>
              </pv-column>
              <pv-column :header="t('bounded.logistics.newDriverForm.colRol')" style="width: 11%">
                <template #body="{ data }">
                  <span class="sf-ldrv__cell-text">{{ rolDisplay(data) }}</span>
                </template>
              </pv-column>
              <pv-column :header="t('bounded.logistics.newDriverForm.colLicencia')" style="width: 16%">
                <template #body="{ data }">
                  <span class="sf-ldrv__cell-clip" :title="data.licencia || ''">{{ data.licencia || '—' }}</span>
                </template>
              </pv-column>
              <pv-column :header="t('bounded.logistics.newDriverForm.colContacto')" style="width: 26%">
                <template #body="{ data }">
                  <span class="sf-ldrv__cell-clip" :title="data.contacto || ''">{{ data.contacto || '—' }}</span>
                </template>
              </pv-column>
              <pv-column style="width: 12%">
                <template #header>
                  <span class="sf-ldrv__th-actions">{{ t('bounded.logistics.newDriverForm.colActions') }}</span>
                </template>
                <template #body="{ data }">
                  <div class="sf-ldrv__row-actions">
                    <button
                        type="button"
                        class="sf-ldrv__icon-btn sf-ldrv__icon-btn--edit"
                        :aria-label="t('bounded.logistics.newDriverForm.edit')"
                        @click="startEdit(data)"
                    >
                      <i class="pi pi-pencil" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        class="sf-ldrv__icon-btn sf-ldrv__icon-btn--delete"
                        :aria-label="t('bounded.logistics.newDriverForm.delete')"
                        @click="requestDelete(data)"
                    >
                      <i class="pi pi-trash" aria-hidden="true" />
                    </button>
                  </div>
                </template>
              </pv-column>
            </pv-data-table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sf-ldrv {
  --sf-ldrv-border: #e5e7eb;
  --sf-ldrv-primary: #2563eb;
  --sf-ldrv-primary-hover: #1d4ed8;
  --sf-ldrv-text: var(--sf-ui-text);
  --sf-ldrv-muted: #64748b;
  --sf-ldrv-placeholder: #94a3b8;

  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1408px;
  margin: 0 auto;
  padding: 0 8px;
}

.sf-ldrv--light-form {
  color-scheme: light;
  color: var(--sf-ldrv-text);
}

.sf-ldrv__layout {
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(280px, 0.78fr) minmax(0, 1.32fr);
  align-items: stretch;
}

.sf-ldrv__card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--sf-ldrv-border);
  border-radius: 14px;
  padding: 22px 24px 22px;
  box-shadow:
      0 1px 2px rgba(15, 23, 42, 0.04),
      0 4px 16px rgba(15, 23, 42, 0.06);
}

.sf-ldrv__card--list {
  min-width: 0;
  padding-top: 22px;
  padding-bottom: 22px;
}

.sf-ldrv__card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.sf-ldrv__card-head-text {
  flex: 1;
  min-width: 0;
}

.sf-ldrv__card-head-text .sf-ldrv__title {
  margin: 0 0 6px;
}

.sf-ldrv__page-desc {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.45;
  color: var(--sf-ldrv-muted);
}

.sf-ldrv__title {
  margin: 0 0 20px;
  font-size: 17px;
  font-weight: 700;
  color: var(--sf-ldrv-text);
  letter-spacing: -0.02em;
}

.sf-ldrv__empty {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}

.sf-ldrv__card--list .sf-ldrv__table-shell {
  flex: 1;
  min-height: 0;
}

.sf-ldrv__table-shell {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--sf-ldrv-border);
  border-radius: 10px;
  overflow: hidden;
  background: #fafbfc;
}

.sf-ldrv__table-wrap {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  margin: 0;
}

.sf-ldrv__table {
  width: 100%;
  min-width: 0;
}

.sf-ldrv__card--list :deep(.p-datatable),
.sf-ldrv__card--list :deep(.p-datatable-table-container) {
  width: 100%;
}

.sf-ldrv__card--list :deep(.p-datatable-table) {
  width: 100%;
  table-layout: fixed;
}

.sf-ldrv__cell-text {
  display: block;
  line-height: 1.5;
  word-break: break-word;
}

.sf-ldrv__cell-code {
  display: block;
  font-family: ui-monospace, 'Cascadia Code', 'Segoe UI Mono', monospace;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: #334155;
  line-height: 1.45;
  word-break: break-all;
}

.sf-ldrv__cell-clip {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.45;
}

.sf-ldrv__th-actions {
  display: block;
  width: 100%;
  text-align: end;
}

.sf-ldrv__row-actions {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
  justify-content: flex-end;
  width: 100%;
  min-width: 0;
}

.sf-ldrv__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  line-height: 1;
  transition:
      background 0.15s ease,
      color 0.15s ease,
      border-color 0.15s ease;
}

.sf-ldrv__icon-btn--edit {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.sf-ldrv__icon-btn--edit:focus-visible {
  outline: 2px solid #22c55e;
  outline-offset: 1px;
}

.sf-ldrv__icon-btn--edit:hover {
  background: #dcfce7;
  border-color: #86efac;
  color: #166534;
}

.sf-ldrv__icon-btn--delete {
  border-color: #fecaca;
  background: #fef2f2;
  color: #dc2626;
}

.sf-ldrv__icon-btn--delete:focus-visible {
  outline: 2px solid #ef4444;
  outline-offset: 1px;
}

.sf-ldrv__icon-btn--delete:hover {
  background: #fee2e2;
  border-color: #f87171;
  color: #b91c1c;
}

.sf-ldrv__grid {
  display: grid;
  gap: 20px 24px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.sf-ldrv__field--full {
  grid-column: 1 / -1;
}

.sf-ldrv__hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
}

.sf-ldrv__label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.sf-ldrv__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--sf-ldrv-border);
}

.sf-ldrv__cancel {
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

.sf-ldrv__cancel:hover {
  color: var(--sf-ui-text);
  background: #f8fafc;
  border-color: #94a3b8;
}

.sf-ldrv__save {
  background: var(--sf-ldrv-primary) !important;
  border-color: var(--sf-ldrv-primary) !important;
  color: #fff !important;
  padding-left: 20px !important;
  padding-right: 20px !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
}

.sf-ldrv__save:not(:disabled):hover {
  background: var(--sf-ldrv-primary-hover) !important;
  border-color: var(--sf-ldrv-primary-hover) !important;
}

.sf-ldrv__save:disabled {
  opacity: 0.55;
}

.sf-ldrv :deep(.p-inputtext) {
  background: #fff !important;
  color: var(--sf-ldrv-text) !important;
  border: 1px solid var(--sf-ldrv-border) !important;
  border-radius: 8px;
}

.sf-ldrv :deep(.p-inputtext::placeholder) {
  color: var(--sf-ldrv-placeholder) !important;
}

.sf-ldrv :deep(.p-inputtext:enabled:focus) {
  border-color: #64748b !important;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.1);
}

.sf-ldrv :deep(.p-select) {
  width: 100%;
  background: #fff !important;
  color: var(--sf-ldrv-text) !important;
  border: 1px solid var(--sf-ldrv-border) !important;
  border-radius: 8px;
  box-shadow: none !important;
}

.sf-ldrv :deep(.p-select:not(.p-disabled):hover) {
  border-color: #cbd5e1 !important;
}

.sf-ldrv :deep(.p-select:not(.p-disabled).p-focus) {
  border-color: #64748b !important;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.1);
}

.sf-ldrv :deep(.p-select-label) {
  color: var(--sf-ldrv-text) !important;
  background: transparent !important;
}

.sf-ldrv :deep(.p-select-dropdown) {
  color: var(--sf-ldrv-muted) !important;
  background: transparent !important;
}

.sf-ldrv__card--list :deep(.p-datatable) {
  border: none;
}

.sf-ldrv__card--list :deep(.p-datatable-header-cell) {
  padding: 11px 16px !important;
  background: #fff !important;
  color: #64748b !important;
  border-color: var(--sf-ldrv-border) !important;
  border-bottom-width: 1px !important;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.sf-ldrv__card--list :deep(.p-datatable-column-title) {
  font-weight: 600;
}

.sf-ldrv__card--list :deep(.p-datatable-tbody > tr) {
  background: #fff !important;
  color: var(--sf-ldrv-text) !important;
}

.sf-ldrv__card--list :deep(.p-datatable-striped .p-datatable-tbody > tr.p-row-odd) {
  background: #fafbfc !important;
}

.sf-ldrv__card--list :deep(.p-datatable-tbody > tr > td) {
  padding: 12px 16px !important;
  border-color: #f1f5f9 !important;
  font-size: 14px;
  vertical-align: middle;
}

.sf-ldrv__card--list :deep(.p-datatable-tbody > tr > td:last-child) {
  text-align: end;
}

.sf-ldrv__card--list :deep(.p-datatable-hoverable .p-datatable-tbody > tr:not(.p-datatable-row-selected):hover) {
  background: #f8fafc !important;
  color: var(--sf-ldrv-text) !important;
}

.sf-ldrv__card--list :deep(.p-datatable-tbody > tr.p-datatable-row-selected) {
  background: #f1f5f9 !important;
  color: var(--sf-ldrv-text) !important;
}

.sf-ldrv__card--list :deep(tr.sf-ldrv__row--editing) {
  background: #f1f5f9 !important;
  box-shadow: inset 3px 0 0 0 #64748b;
}

.sf-ldrv__card--list :deep(tr.sf-ldrv__row--editing > td) {
  border-color: #e2e8f0 !important;
}

@media (max-width: 960px) {
  .sf-ldrv__layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .sf-ldrv__grid {
    grid-template-columns: 1fr;
  }

  .sf-ldrv__field--full {
    grid-column: 1;
  }
}
</style>
