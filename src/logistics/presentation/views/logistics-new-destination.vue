<script setup>
import { computed, onActivated, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { logisticsApi } from '../../infrastructure/logistics-api.js'

const { t, locale } = useI18n()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const destinos = ref([])
const editingId = ref(null)
const nombre = ref('')
const saving = ref(false)

function localizedField(o) {
  if (!o) return ''
  if (typeof o === 'string') return o.trim()
  const loc = locale.value === 'es' ? 'es' : 'en'
  return String(o[loc] ?? o.en ?? o.es ?? '').trim() || '—'
}

function nombreToFormField(d) {
  const n = d?.nombre
  if (typeof n === 'string') return n.trim()
  if (n && typeof n === 'object') {
    const loc = locale.value === 'es' ? 'es' : 'en'
    return String(n[loc] ?? n.en ?? n.es ?? '').trim()
  }
  return ''
}

async function loadDestinos() {
  try {
    destinos.value = await logisticsApi.listDestinos()
  } catch {
    destinos.value = []
  }
}

onMounted(() => {
  loadDestinos()
})

onActivated(() => {
  loadDestinos()
})

const canSave = computed(() => !saving.value && nombre.value.trim().length > 0)

const saveLabel = computed(() =>
    editingId.value
        ? t('bounded.logistics.newDestinationForm.updateSave')
        : t('bounded.logistics.newDestinationForm.save'),
)

function resetForm() {
  editingId.value = null
  nombre.value = ''
}

function startEdit(row) {
  editingId.value = row.idDestino
  nombre.value = nombreToFormField(row)
}

function rowClassForDestino(data) {
  if (editingId.value != null && String(editingId.value) === String(data?.idDestino)) {
    return 'sf-lnd__row--editing'
  }
  return ''
}

async function submit() {
  if (!canSave.value) {
    toast.add({
      severity: 'warn',
      summary: t('bounded.logistics.newDestinationForm.cardTitle'),
      detail: t('bounded.logistics.newDestinationForm.validationError'),
      life: 4000,
    })
    return
  }
  saving.value = true
  try {
    const payload = { nombre: nombre.value.trim() }
    if (editingId.value) {
      await logisticsApi.updateDestino(String(editingId.value), payload)
      toast.add({
        severity: 'success',
        summary: t('bounded.logistics.newDestinationForm.updateSave'),
        detail: t('bounded.logistics.newDestinationForm.updateSuccess'),
        life: 4000,
      })
    } else {
      await logisticsApi.createDestino(payload)
      toast.add({
        severity: 'success',
        summary: t('bounded.logistics.newDestinationForm.save'),
        detail: t('bounded.logistics.newDestinationForm.saveSuccess'),
        life: 4000,
      })
    }
    await loadDestinos()
    resetForm()
  } catch (e) {
    const code = e?.response?.data?.error
    let detail = editingId.value
        ? t('bounded.logistics.newDestinationForm.updateError')
        : t('bounded.logistics.newDestinationForm.saveError')
    if (code === 'codigo_exists') detail = t('bounded.logistics.newDestinationForm.errorCodigoExists')
    toast.add({
      severity: 'error',
      summary: editingId.value
          ? t('bounded.logistics.newDestinationForm.updateSave')
          : t('bounded.logistics.newDestinationForm.save'),
      detail,
      life: 6000,
    })
    console.warn(e)
  } finally {
    saving.value = false
  }
}

function requestDelete(row) {
  const name = localizedField(row.nombre)
  confirm.require({
    header: t('bounded.logistics.newDestinationForm.deleteHeader'),
    message: t('bounded.logistics.newDestinationForm.deleteMessage', { name }),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => void doDelete(row),
  })
}

async function doDelete(row) {
  try {
    await logisticsApi.deleteDestino(String(row.idDestino))
    if (editingId.value === row.idDestino) resetForm()
    await loadDestinos()
    toast.add({
      severity: 'success',
      summary: t('bounded.logistics.newDestinationForm.delete'),
      detail: t('bounded.logistics.newDestinationForm.deleteSuccess'),
      life: 3500,
    })
  } catch (e) {
    const code = e?.response?.data?.error
    const detail =
        code === 'destino_in_use'
            ? t('bounded.logistics.newDestinationForm.deleteBlocked')
            : t('bounded.logistics.newDestinationForm.deleteError')
    toast.add({
      severity: 'error',
      summary: t('bounded.logistics.newDestinationForm.delete'),
      detail,
      life: 6000,
    })
    console.warn(e)
  }
}
</script>

<template>
  <div class="sf-lnd sf-lnd--light-form">
    <div class="sf-lnd__layout">
      <div class="sf-lnd__card">
        <div class="sf-lnd__card-head">
          <div class="sf-lnd__card-head-text">
            <h3 class="sf-lnd__title">{{ t('bounded.logistics.newDestinationForm.cardTitle') }}</h3>
            <p class="sf-lnd__page-desc">{{ t('bounded.logistics.newDestinationForm.pageTitle') }}</p>
          </div>
          <pv-button
              v-if="editingId"
              type="button"
              severity="secondary"
              outlined
              size="small"
              :label="t('bounded.logistics.newDestinationForm.cancelEdit')"
              @click="resetForm"
          />
        </div>

        <div class="sf-lnd__field">
          <label class="sf-lnd__label" for="lnd-nombre">{{ t('bounded.logistics.newDestinationForm.nombre') }}</label>
          <pv-input-text id="lnd-nombre" v-model="nombre" class="sf-lnd__input" fluid autocomplete="off" />
        </div>

        <div class="sf-lnd__actions">
          <button type="button" class="sf-lnd__cancel" @click="router.back()">
            {{ t('bounded.logistics.newDestinationForm.cancel') }}
          </button>
          <pv-button
              type="button"
              class="sf-lnd__save"
              :label="saveLabel"
              :disabled="!canSave"
              :loading="saving"
              @click="submit"
          />
        </div>
      </div>

      <div class="sf-lnd__card sf-lnd__card--list">
        <p v-if="!destinos.length" class="sf-lnd__empty">{{ t('bounded.logistics.newDestinationForm.listEmpty') }}</p>
        <div v-else class="sf-lnd__table-shell">
          <div class="sf-lnd__table-wrap">
            <pv-data-table
                :value="destinos"
                data-key="idDestino"
                striped-rows
                row-hover
                class="sf-lnd__table"
                :table-style="{ width: '100%' }"
                :row-class="rowClassForDestino"
            >
              <pv-column :header="t('bounded.logistics.newDestinationForm.colNombre')" style="width: 88%">
                <template #body="{ data }">
                  <span class="sf-lnd__cell-text">{{ localizedField(data.nombre) }}</span>
                </template>
              </pv-column>
              <pv-column style="width: 12%">
                <template #header>
                  <span class="sf-lnd__th-actions">{{ t('bounded.logistics.newDestinationForm.colActions') }}</span>
                </template>
                <template #body="{ data }">
                  <div class="sf-lnd__row-actions">
                    <button
                        type="button"
                        class="sf-lnd__icon-btn sf-lnd__icon-btn--edit"
                        :aria-label="t('bounded.logistics.newDestinationForm.edit')"
                        @click="startEdit(data)"
                    >
                      <i class="pi pi-pencil" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        class="sf-lnd__icon-btn sf-lnd__icon-btn--delete"
                        :aria-label="t('bounded.logistics.newDestinationForm.delete')"
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
.sf-lnd {
  --sf-lnd-border: #e5e7eb;
  --sf-lnd-primary: #2563eb;
  --sf-lnd-primary-hover: #1d4ed8;
  --sf-lnd-text: var(--sf-ui-text);
  --sf-lnd-muted: #64748b;
  --sf-lnd-placeholder: #94a3b8;

  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1408px;
  margin: 0 auto;
  padding: 0 8px;
}

.sf-lnd--light-form {
  color-scheme: light;
  color: var(--sf-lnd-text);
}

.sf-lnd__layout {
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(280px, 0.78fr) minmax(0, 1.32fr);
  align-items: start;
}

.sf-lnd__card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--sf-lnd-border);
  border-radius: 14px;
  padding: 22px 24px 22px;
  box-shadow:
      0 1px 2px rgba(15, 23, 42, 0.04),
      0 4px 16px rgba(15, 23, 42, 0.06);
}

.sf-lnd__card--list {
  min-width: 0;
  padding-top: 22px;
  padding-bottom: 22px;
}

.sf-lnd__card--list .sf-lnd__table-shell {
  flex: 1;
  min-height: 0;
}

.sf-lnd__card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.sf-lnd__card-head-text {
  flex: 1;
  min-width: 0;
}

.sf-lnd__card-head-text .sf-lnd__title {
  margin: 0 0 6px;
}

.sf-lnd__page-desc {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.45;
  color: var(--sf-lnd-muted);
}

.sf-lnd__title {
  margin: 0 0 20px;
  font-size: 17px;
  font-weight: 700;
  color: var(--sf-lnd-text);
  letter-spacing: -0.02em;
}

.sf-lnd__empty {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}

.sf-lnd__table-shell {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--sf-lnd-border);
  border-radius: 10px;
  overflow: hidden;
  background: #fafbfc;
}

.sf-lnd__table-wrap {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  margin: 0;
}

.sf-lnd__table {
  width: 100%;
  min-width: 0;
}

.sf-lnd__card--list :deep(.p-datatable),
.sf-lnd__card--list :deep(.p-datatable-table-container) {
  width: 100%;
}

.sf-lnd__card--list :deep(.p-datatable-table) {
  width: 100%;
  table-layout: fixed;
}

.sf-lnd__cell-text {
  display: block;
  line-height: 1.5;
  word-break: break-word;
}

.sf-lnd__th-actions {
  display: block;
  width: 100%;
  text-align: end;
}

.sf-lnd__row-actions {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
  justify-content: flex-end;
  width: 100%;
  min-width: 0;
}

.sf-lnd__icon-btn {
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

.sf-lnd__icon-btn--edit {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.sf-lnd__icon-btn--edit:focus-visible {
  outline: 2px solid #22c55e;
  outline-offset: 1px;
}

.sf-lnd__icon-btn--edit:hover {
  background: #dcfce7;
  border-color: #86efac;
  color: #166534;
}

.sf-lnd__icon-btn--delete {
  border-color: #fecaca;
  background: #fef2f2;
  color: #dc2626;
}

.sf-lnd__icon-btn--delete:focus-visible {
  outline: 2px solid #ef4444;
  outline-offset: 1px;
}

.sf-lnd__icon-btn--delete:hover {
  background: #fee2e2;
  border-color: #f87171;
  color: #b91c1c;
}

.sf-lnd__field {
  margin-bottom: 0;
}

.sf-lnd__label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.sf-lnd__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--sf-lnd-border);
}

.sf-lnd__cancel {
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

.sf-lnd__cancel:hover {
  color: var(--sf-ui-text);
  background: #f8fafc;
  border-color: #94a3b8;
}

.sf-lnd__save {
  background: var(--sf-lnd-primary) !important;
  border-color: var(--sf-lnd-primary) !important;
  color: #fff !important;
  padding-left: 20px !important;
  padding-right: 20px !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
}

.sf-lnd__save:not(:disabled):hover {
  background: var(--sf-lnd-primary-hover) !important;
  border-color: var(--sf-lnd-primary-hover) !important;
}

.sf-lnd__save:disabled {
  opacity: 0.55;
}

.sf-lnd :deep(.p-inputtext) {
  background: #fff !important;
  color: var(--sf-lnd-text) !important;
  border: 1px solid var(--sf-lnd-border) !important;
  border-radius: 8px;
}

.sf-lnd :deep(.p-inputtext::placeholder) {
  color: var(--sf-lnd-placeholder) !important;
}

.sf-lnd :deep(.p-inputtext:enabled:focus) {
  border-color: #64748b !important;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.1);
}

.sf-lnd__card--list :deep(.p-datatable) {
  border: none;
}

.sf-lnd__card--list :deep(.p-datatable-header-cell) {
  padding: 11px 16px !important;
  background: #fff !important;
  color: #64748b !important;
  border-color: var(--sf-lnd-border) !important;
  border-bottom-width: 1px !important;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.sf-lnd__card--list :deep(.p-datatable-column-title) {
  font-weight: 600;
}

.sf-lnd__card--list :deep(.p-datatable-tbody > tr) {
  background: #fff !important;
  color: var(--sf-lnd-text) !important;
}

.sf-lnd__card--list :deep(.p-datatable-striped .p-datatable-tbody > tr.p-row-odd) {
  background: #fafbfc !important;
}

.sf-lnd__card--list :deep(.p-datatable-tbody > tr > td) {
  padding: 12px 16px !important;
  border-color: #f1f5f9 !important;
  font-size: 14px;
  vertical-align: middle;
}

.sf-lnd__card--list :deep(.p-datatable-tbody > tr > td:last-child) {
  text-align: end;
}

.sf-lnd__card--list :deep(.p-datatable-hoverable .p-datatable-tbody > tr:not(.p-datatable-row-selected):hover) {
  background: #f8fafc !important;
  color: var(--sf-lnd-text) !important;
}

.sf-lnd__card--list :deep(.p-datatable-tbody > tr.p-datatable-row-selected) {
  background: #f1f5f9 !important;
  color: var(--sf-lnd-text) !important;
}

.sf-lnd__card--list :deep(tr.sf-lnd__row--editing) {
  background: #f1f5f9 !important;
  box-shadow: inset 3px 0 0 0 #64748b;
}

.sf-lnd__card--list :deep(tr.sf-lnd__row--editing > td) {
  border-color: #e2e8f0 !important;
}

@media (max-width: 960px) {
  .sf-lnd__layout {
    grid-template-columns: 1fr;
  }
}
</style>
