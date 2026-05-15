<script setup>
import { Package, Thermometer } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

defineProps({
  rows: {
    type: Array,
    required: true,
  },
})

const { t, locale } = useI18n()

/** Texto localizado desde objeto `{ en, es }` o clave i18n legacy `bounded.inventory.rows.*` */
function rowText(data, key) {
  const pack = data[key]
  if (pack && typeof pack === 'object' && (pack.en != null || pack.es != null)) {
    const loc = locale.value === 'es' ? 'es' : 'en'
    return pack[loc] ?? pack.en ?? pack.es ?? ''
  }
  const i18nSuffix = key === 'tempLabel' ? 'temp' : key
  return t(`bounded.inventory.rows.${data.rowId}.${i18nSuffix}`)
}

function tempClass(tone) {
  return tone === 'frozen' ? 'sf-inv-row-temp--frozen' : 'sf-inv-row-temp--chilled'
}

function cellIdProducto(data) {
  return data.idProducto != null && data.idProducto !== '' ? String(data.idProducto) : '—'
}

function cellTemp(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—'
  return `${Number(n)} °C`
}

function formatDate(val) {
  if (val == null || val === '') return '—'
  const d = new Date(typeof val === 'string' ? val : String(val))
  if (Number.isNaN(d.getTime())) return String(val)
  return d.toLocaleDateString(locale.value === 'es' ? 'es' : 'en-US', { dateStyle: 'medium' })
}

function cellLote(data) {
  return data.lote != null && String(data.lote).length > 0 ? String(data.lote) : '—'
}
</script>

<template>
  <div class="sf-inv-table-wrap sf-inv-table-light">
    <pv-data-table :value="rows" data-key="rowId" striped-rows class="sf-inv-table">
      <pv-column :header="t('bounded.inventory.table.idProducto')" :style="{ minWidth: '88px' }">
        <template #body="{ data }">
          <span class="sf-inv-code">{{ cellIdProducto(data) }}</span>
        </template>
      </pv-column>
      <pv-column :header="t('bounded.inventory.table.nombre')" :style="{ minWidth: '176px' }">
        <template #body="{ data }">
          <span class="sf-inv-product">
            <Package class="sf-inv-product__icon" aria-hidden="true" />
            <span class="sf-inv-product__name">{{ rowText(data, 'name') }}</span>
          </span>
        </template>
      </pv-column>
      <pv-column :header="t('bounded.inventory.table.category')" :style="{ minWidth: '112px' }">
        <template #body="{ data }">
          <span class="sf-inv-muted">{{ rowText(data, 'category') }}</span>
        </template>
      </pv-column>
      <pv-column :header="t('bounded.inventory.table.tempMin')" :style="{ minWidth: '104px' }">
        <template #body="{ data }">
          <span class="sf-inv-temp" :class="tempClass(data.tempTone)">
            <Thermometer class="sf-inv-temp__icon" aria-hidden="true" />
            {{ cellTemp(data.temperaturaMin) }}
          </span>
        </template>
      </pv-column>
      <pv-column :header="t('bounded.inventory.table.tempMax')" :style="{ minWidth: '104px' }">
        <template #body="{ data }">
          <span class="sf-inv-temp" :class="tempClass(data.tempTone)">
            <Thermometer class="sf-inv-temp__icon" aria-hidden="true" />
            {{ cellTemp(data.temperaturaMax) }}
          </span>
        </template>
      </pv-column>
      <pv-column :header="t('bounded.inventory.table.fechaVencimiento')" :style="{ minWidth: '128px' }">
        <template #body="{ data }">
          <span class="sf-inv-muted">{{ formatDate(data.fechaVencimiento) }}</span>
        </template>
      </pv-column>
      <pv-column :header="t('bounded.inventory.table.fechaIngreso')" :style="{ minWidth: '128px' }">
        <template #body="{ data }">
          <span class="sf-inv-muted">{{ formatDate(data.fechaIngreso) }}</span>
        </template>
      </pv-column>
      <pv-column :header="t('bounded.inventory.table.lote')" :style="{ minWidth: '96px' }">
        <template #body="{ data }">
          <span class="sf-inv-code">{{ cellLote(data) }}</span>
        </template>
      </pv-column>
      <pv-column :header="t('bounded.inventory.table.location')" :style="{ minWidth: '144px' }">
        <template #body="{ data }">
          <span class="sf-inv-muted">{{ rowText(data, 'location') }}</span>
        </template>
      </pv-column>
    </pv-data-table>
  </div>
</template>

<style scoped>
.sf-inv-table-wrap {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.sf-inv-table-light {
  color-scheme: light;
}

.sf-inv-table-light :deep(.p-datatable) {
  --p-datatable-header-cell-background: #f8fafc;
  --p-datatable-row-background: #fff;
  --p-datatable-row-hover-background: #f1f5f9;
  --p-datatable-body-cell-border-color: #e2e8f0;
  --p-datatable-header-cell-color: #64748b;
  --p-datatable-body-cell-color: var(--sf-ui-text);
}

.sf-inv-table-light :deep(.p-datatable-tbody > tr) {
  background: #fff !important;
  color: var(--sf-ui-text) !important;
}

.sf-inv-table-light :deep(.p-datatable-tbody > tr:nth-child(even)) {
  background: #f8fafc !important;
}

.sf-inv-table-light :deep(.p-datatable-tbody > tr > td) {
  border-color: #e2e8f0 !important;
  padding: 15px 16px;
  font-weight: 400;
  font-size: 15px;
  line-height: 1.5;
}

.sf-inv-table-light :deep(.p-datatable-thead > tr > th) {
  padding: 13px 16px;
  font-family: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.sf-inv-code {
  font-family: 'Inter', system-ui, sans-serif;
  font-variant-numeric: tabular-nums;
  font-size: 15px;
  font-weight: 500;
  color: #475569;
}

.sf-inv-product {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.sf-inv-product__icon {
  width: 18px;
  height: 18px;
  color: #94a3b8;
  flex-shrink: 0;
}

.sf-inv-product__name {
  font-weight: 500;
  font-size: 15px;
  color: var(--sf-ui-text);
}

.sf-inv-muted {
  color: #64748b;
  font-size: 15px;
}

.sf-inv-temp {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  font-size: 15px;
}

.sf-inv-temp__icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

.sf-inv-row-temp--chilled {
  color: #2563eb;
}

.sf-inv-row-temp--chilled .sf-inv-temp__icon {
  color: #3b82f6;
}

.sf-inv-row-temp--frozen {
  color: #dc2626;
}

.sf-inv-row-temp--frozen .sf-inv-temp__icon {
  color: #ef4444;
}
</style>
