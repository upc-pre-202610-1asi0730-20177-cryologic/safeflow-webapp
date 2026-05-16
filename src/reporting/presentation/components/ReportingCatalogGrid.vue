<script setup>
import { FileText } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useReportingStore } from '../../application/reporting.store.js'

defineProps({
  items: {
    type: Array,
    required: true,
  },
})

const { t } = useI18n()
const toast = useToast()
const reporting = useReportingStore()

/** Viñetas por id de ítem del catálogo (i18n). */
const CATALOG_INCLUDE_KEYS = {
  c1: [
    'bounded.reporting.catalog.c1.inc1',
    'bounded.reporting.catalog.c1.inc2',
    'bounded.reporting.catalog.c1.inc3',
    'bounded.reporting.catalog.c1.inc4',
    'bounded.reporting.catalog.c1.inc5',
  ],
}

function includesFor(id) {
  return CATALOG_INCLUDE_KEYS[id] ?? []
}

function onGenerate(c) {
  const r = reporting.generateReport(c.id)
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
</script>

<template>
  <div class="sf-rep-catalog">
    <h2 class="sf-rep-section-title">{{ t('bounded.reporting.catalogSection') }}</h2>
    <div class="sf-rep-catalog__grid">
      <article v-for="c in items" :key="c.id" class="sf-rep-catalog-card">
        <div class="sf-rep-catalog-card__head">
          <FileText class="sf-rep-catalog-card__doc" aria-hidden="true" />
          <span class="sf-rep-format-badge">{{ formatLabel(c.format) }}</span>
        </div>
        <h3 class="sf-rep-catalog-card__title">{{ t(c.titleKey) }}</h3>
        <p class="sf-rep-catalog-card__desc">{{ t(c.descriptionKey) }}</p>
        <p v-if="includesFor(c.id).length" class="sf-rep-catalog-card__includes-label">
          {{ t('bounded.reporting.catalogIncludesTitle') }}
        </p>
        <ul v-if="includesFor(c.id).length" class="sf-rep-catalog-card__includes">
          <li v-for="key in includesFor(c.id)" :key="key" class="sf-rep-catalog-card__includes-item">
            {{ t(key) }}
          </li>
        </ul>
        <pv-button
          class="sf-rep-catalog-card__action"
          fluid
          size="small"
          :label="t('bounded.reporting.generate')"
          icon="pi pi-download"
          type="button"
          @click.stop.prevent="onGenerate(c)"
        />
      </article>
    </div>
  </div>
</template>

<style scoped>
.sf-rep-section-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 700;
  color: var(--sf-ui-text);
}

.sf-rep-catalog__grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

.sf-rep-catalog-card {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px 22px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 3px solid #2563eb;
}

.sf-rep-catalog-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sf-rep-format-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #334155;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  flex-shrink: 0;
}

.sf-rep-catalog-card__doc {
  width: 20px;
  height: 20px;
  color: #64748b;
}

.sf-rep-catalog-card__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--sf-ui-text);
  line-height: 1.35;
}

.sf-rep-catalog-card__desc {
  margin: 0;
  font-size: 14px;
  color: #475569;
  line-height: 1.45;
}

.sf-rep-catalog-card__includes-label {
  margin: 4px 0 0;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.sf-rep-catalog-card__includes {
  margin: 0 0 4px;
  padding: 0 0 0 18px;
  font-size: 13px;
  color: #334155;
  line-height: 1.45;
}

.sf-rep-catalog-card__includes-item {
  margin-bottom: 6px;
}

.sf-rep-catalog-card__includes-item:last-child {
  margin-bottom: 0;
}

.sf-rep-catalog-card :deep(.sf-rep-catalog-card__action) {
  width: 100% !important;
  max-width: 100%;
  align-self: stretch;
  margin-top: 6px;
  justify-content: center;
  background: #2563eb !important;
  border-color: #2563eb !important;
  color: #fff !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
  padding-block: 10px !important;
}

.sf-rep-catalog-card :deep(.sf-rep-catalog-card__action .p-button-label) {
  flex: 0 1 auto;
}

.sf-rep-catalog-card :deep(.sf-rep-catalog-card__action:not(:disabled):hover) {
  background: #1d4ed8 !important;
  border-color: #1d4ed8 !important;
}
</style>
