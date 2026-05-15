<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  mix: {
    type: Object,
    required: true,
  },
})

const { t } = useI18n()

const legend = [
  { key: 'delivered', color: '#22c55e' },
  { key: 'transit', color: '#3b82f6' },
  { key: 'pending', color: '#eab308' },
  { key: 'delayed', color: '#ef4444' },
]
</script>

<template>
  <div class="sf-analytics-card sf-analytics-card-light">
    <h2 class="sf-analytics-card-title sf-analytics-card-title-spaced">
      {{ t('bounded.analytics.deliveryStatus.title') }}
    </h2>
    <p class="sf-analytics-card-lead">{{ t('bounded.analytics.deliveryStatus.lead') }}</p>
    <div class="sf-analytics-mix" aria-hidden="true">
      <div
        class="sf-analytics-mix-seg sf-analytics-mix-seg-delivered"
        :style="{ flexGrow: mix.deliveredPct }"
      />
      <div
        class="sf-analytics-mix-seg sf-analytics-mix-seg-transit"
        :style="{ flexGrow: mix.transitPct }"
      />
      <div
        class="sf-analytics-mix-seg sf-analytics-mix-seg-pending"
        :style="{ flexGrow: mix.pendingPct }"
      />
      <div
        class="sf-analytics-mix-seg sf-analytics-mix-seg-delayed"
        :style="{ flexGrow: mix.delayedPct }"
      />
    </div>
    <ul class="sf-analytics-legend">
      <li v-for="item in legend" :key="item.key" class="sf-analytics-legend-item">
        <span class="sf-analytics-legend-dot" :style="{ background: item.color }" />
        {{ t(`bounded.analytics.deliveryStatus.legend.${item.key}`) }}
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
  margin-bottom: 8px;
}

.sf-analytics-card-lead {
  margin: 0 0 16px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.45;
}

.sf-analytics-mix {
  display: flex;
  width: 100%;
  height: 12px;
  border-radius: 9999px;
  overflow: hidden;
  background: #e2e8f0;
  margin-bottom: 16px;
}

.sf-analytics-mix-seg {
  min-width: 4px;
}

.sf-analytics-mix-seg-delivered {
  background: #22c55e;
}

.sf-analytics-mix-seg-transit {
  background: #3b82f6;
}

.sf-analytics-mix-seg-pending {
  background: #eab308;
}

.sf-analytics-mix-seg-delayed {
  background: #ef4444;
}

.sf-analytics-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.sf-analytics-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #475569;
}

.sf-analytics-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
