<script setup>
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useReportingStore } from '../../application/reporting.store.js'

defineProps({
  rows: {
    type: Array,
    required: true,
  },
})

const { t } = useI18n()
const toast = useToast()
const reporting = useReportingStore()

function onDownloadRow(data) {
  if (data.status !== 'ready') return
  const r = reporting.generateReport(data.rowId)
  if (r.ok) {
    toast.add({
      severity: 'success',
      summary: t('bounded.reporting.downloadOkSummary'),
      detail: t('bounded.reporting.downloadOkDetail'),
      life: 4000,
    })
  } else {
    toast.add({
      severity: 'error',
      summary: t('bounded.reporting.downloadErrSummary'),
      detail: r.error || t('bounded.reporting.downloadErrDetail'),
      life: 6000,
    })
  }
}

function formatLabel(fmt) {
  return fmt.toUpperCase()
}

function tagSeverity(status) {
  return status === 'ready' ? 'success' : 'warn'
}
</script>

<template>
  <div class="sf-rep-runs sf-rep-runs--light">
    <div class="sf-rep-runs__head">
      <h2 class="sf-rep-section-title">{{ t('bounded.reporting.recentSection') }}</h2>
    </div>
    <pv-data-table :value="rows" data-key="rowId" class="sf-rep-table">
      <pv-column :header="t('bounded.reporting.table.report')" :style="{ minWidth: '192px' }">
        <template #body="{ data }">
          <span class="sf-rep-table__title">{{ t(data.titleKey) }}</span>
        </template>
      </pv-column>
      <pv-column :header="t('bounded.reporting.table.format')" style="width: 96px">
        <template #body="{ data }">
          <span class="sf-rep-mono">{{ formatLabel(data.format) }}</span>
        </template>
      </pv-column>
      <pv-column :header="t('bounded.reporting.table.generated')" style="width: 176px">
        <template #body="{ data }">
          {{ t(data.generatedKey) }}
        </template>
      </pv-column>
      <pv-column :header="t('bounded.reporting.table.status')" style="width: 144px">
        <template #body="{ data }">
          <pv-tag :severity="tagSeverity(data.status)" rounded>
            {{ t(`bounded.reporting.runStatus.${data.status}`) }}
          </pv-tag>
        </template>
      </pv-column>
      <pv-column :header="t('bounded.reporting.table.action')" style="width: 80px">
        <template #body="{ data }">
          <button
            type="button"
            class="sf-rep-link"
            :disabled="data.status !== 'ready'"
            :title="data.status !== 'ready' ? t('bounded.reporting.table.waiting') : ''"
            @click.stop.prevent="onDownloadRow(data)"
          >
            {{ t('bounded.reporting.table.download') }}
          </button>
        </template>
      </pv-column>
    </pv-data-table>
  </div>
</template>

<style scoped>
.sf-rep-runs {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  padding: 18px 20px;
  overflow: hidden;
}

.sf-rep-runs--light {
  color-scheme: light;
}

.sf-rep-runs__head {
  margin-bottom: 12px;
}

.sf-rep-section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--sf-ui-text);
}

.sf-rep-runs :deep(.p-datatable) {
  --p-datatable-header-cell-background: #f8fafc;
  --p-datatable-row-background: #fff;
  --p-datatable-row-hover-background: #f1f5f9;
  --p-datatable-body-cell-border-color: #e2e8f0;
  --p-datatable-header-cell-color: #64748b;
  --p-datatable-body-cell-color: var(--sf-ui-text);
}

.sf-rep-runs :deep(.p-datatable-tbody > tr) {
  background: #fff !important;
  color: var(--sf-ui-text) !important;
}

.sf-rep-runs :deep(.p-datatable-tbody > tr > td) {
  border-color: #e2e8f0 !important;
  padding: 12px 14px;
  font-size: 14px;
}

.sf-rep-runs :deep(.p-datatable-thead > tr > th) {
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.sf-rep-table__title {
  font-weight: 600;
  color: var(--sf-ui-text);
}

.sf-rep-mono {
  font-family: 'Inter', system-ui, sans-serif;
  font-variant-numeric: tabular-nums;
  font-size: 14px;
  font-weight: 500;
}

.sf-rep-link {
  border: none;
  background: none;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  color: #1d4ed8;
  cursor: pointer;
}

.sf-rep-link:hover:not(:disabled) {
  color: #1e3a8a;
  text-decoration: underline;
}

.sf-rep-link:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}
</style>
