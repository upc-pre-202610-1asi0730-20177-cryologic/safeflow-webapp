<script setup>
import { Truck } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

defineProps({
  items: {
    type: Array,
    required: true,
  },
})

const { t, locale } = useI18n()

function locName(field) {
  if (field == null || typeof field !== 'object') return '—'
  const l = locale.value === 'es' ? 'es' : 'en'
  return l === 'es' ? field.es ?? field.en ?? '—' : field.en ?? field.es ?? '—'
}
</script>

<template>
  <div class="sf-analytics-card sf-analytics-card-light sf-analytics-fleet">
    <h2 class="sf-analytics-card-title sf-analytics-card-title-spaced">
      {{ t('bounded.analytics.fleet.title') }}
    </h2>
    <ul class="sf-analytics-fleet-list">
      <li v-for="u in items" :key="u.rowId" class="sf-analytics-fleet-row">
        <div class="sf-analytics-fleet-icon-wrap" aria-hidden="true">
          <Truck class="sf-analytics-fleet-icon" />
        </div>
        <div class="sf-analytics-fleet-body">
          <p class="sf-analytics-fleet-line">
            {{ locName(u.nameLoc) }}
            <span class="sf-analytics-fleet-veh">({{ u.vehicleCode }})</span>
          </p>
          <p class="sf-analytics-fleet-status">{{ t(`bounded.analytics.fleetStatus.${u.status}`) }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.sf-analytics-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  padding: 18px 20px;
}

.sf-analytics-card-light {
  color-scheme: light;
}

.sf-analytics-card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--sf-ui-text);
}

.sf-analytics-card-title-spaced {
  margin-bottom: 16px;
}

.sf-analytics-fleet-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sf-analytics-fleet-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.sf-analytics-fleet-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  flex-shrink: 0;
}

.sf-analytics-fleet-icon {
  width: 18px;
  height: 18px;
}

.sf-analytics-fleet-body {
  min-width: 0;
  flex: 1;
}

.sf-analytics-fleet-line {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 600;
  color: var(--sf-ui-text);
}

.sf-analytics-fleet-veh {
  font-weight: 500;
  color: #64748b;
  margin-left: 4px;
}

.sf-analytics-fleet-status {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}
</style>
