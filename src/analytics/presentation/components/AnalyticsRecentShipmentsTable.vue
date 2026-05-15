<script setup>
import { useI18n } from 'vue-i18n'
import ShipmentStatusPill from '@/shared/presentation/components/ShipmentStatusPill.vue'

defineProps({
  rows: {
    type: Array,
    required: true,
  },
})

const { t, locale } = useI18n()

function locField(field) {
  if (field == null || typeof field !== 'object') return '—'
  const l = locale.value === 'es' ? 'es' : 'en'
  return l === 'es' ? field.es ?? field.en ?? '—' : field.en ?? field.es ?? '—'
}

function formatShipmentDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString(locale.value === 'es' ? 'es' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="sf-analytics-card sf-analytics-card-light sf-analytics-table-wrap">
    <div class="sf-analytics-card-head sf-analytics-card-head-table">
      <h2 class="sf-analytics-card-title">{{ t('bounded.analytics.recent.title') }}</h2>
    </div>
    <pv-data-table :value="rows" data-key="rowId" class="sf-analytics-table">
      <pv-column :header="t('bounded.analytics.table.id')" style="width: 11%; min-width: 104px">
        <template #body="{ data }">
          <span class="sf-analytics-mono">{{ data.trackingId }}</span>
        </template>
      </pv-column>
      <pv-column :header="t('bounded.analytics.table.destination')" style="width: 26%; min-width: 160px">
        <template #body="{ data }">
          {{ locField(data.destination) }}
        </template>
      </pv-column>
      <pv-column :header="t('bounded.analytics.table.status')" style="width: 15%; min-width: 136px">
        <template #body="{ data }">
          <ShipmentStatusPill
            :status="data.status"
            :label="t(`bounded.analytics.shipmentStatus.${data.status}`)"
          />
        </template>
      </pv-column>
      <pv-column :header="t('bounded.analytics.table.date')" style="width: 24%; min-width: 176px">
        <template #body="{ data }">
          {{ formatShipmentDate(data.dateIso) }}
        </template>
      </pv-column>
      <pv-column :header="t('bounded.analytics.table.driver')" style="width: 24%; min-width: 128px">
        <template #body="{ data }">
          {{ locField(data.carrier) }}
        </template>
      </pv-column>
    </pv-data-table>
  </div>
</template>

<style scoped>
.sf-analytics-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  padding: 22px 24px 24px;
  overflow: hidden;
}

.sf-analytics-card-light {
  color-scheme: light;
}

.sf-analytics-table-wrap :deep(.p-datatable-table) {
  width: 100%;
  table-layout: fixed;
}

.sf-analytics-table-wrap :deep(.p-datatable) {
  --p-datatable-header-cell-background: #f8fafc;
  --p-datatable-row-background: #fff;
  --p-datatable-row-hover-background: #f1f5f9;
  --p-datatable-body-cell-border-color: #e2e8f0;
  --p-datatable-header-cell-color: #64748b;
  --p-datatable-body-cell-color: var(--sf-ui-text);
}

.sf-analytics-table-wrap :deep(.p-datatable-tbody > tr) {
  background: #fff !important;
  color: var(--sf-ui-text) !important;
}

.sf-analytics-table-wrap :deep(.p-datatable-tbody > tr > td) {
  border-color: #e2e8f0 !important;
  padding: 16px 18px;
  font-size: 14px;
  line-height: 1.45;
  vertical-align: middle;
}

.sf-analytics-table-wrap :deep(.p-datatable-thead > tr > th) {
  padding: 14px 18px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  vertical-align: middle;
}

.sf-analytics-card-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}

.sf-analytics-card-head-table {
  padding-right: 0;
}

.sf-analytics-card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--sf-ui-text);
}

.sf-analytics-mono {
  font-family: 'Inter', system-ui, sans-serif;
  font-variant-numeric: tabular-nums;
  font-size: 14px;
  font-weight: 600;
  color: var(--sf-ui-text);
}
</style>
