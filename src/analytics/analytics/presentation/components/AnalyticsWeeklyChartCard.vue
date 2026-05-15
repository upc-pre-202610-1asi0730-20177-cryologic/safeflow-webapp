<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  weekSeries: {
    type: Array,
    default: () => [],
  },
  monthSeries: {
    type: Array,
    default: () => [],
  },
})

const { t, locale } = useI18n()

const period = ref('week')

const periodOptions = computed(() => [
  { label: t('bounded.analytics.chart.periodWeek'), value: 'week' },
  { label: t('bounded.analytics.chart.periodMonth'), value: 'month' },
])

const series = computed(() => (period.value === 'week' ? props.weekSeries : props.monthSeries))

const maxVal = computed(() => {
  const vals = series.value.map((b) => b.value)
  return Math.max(1, ...vals, 0)
})

function barLabel(key) {
  if (!key) return ''
  if (period.value === 'week') {
    const d = new Date(`${key}T12:00:00`)
    if (Number.isNaN(d.getTime())) return key
    return d.toLocaleDateString(locale.value === 'es' ? 'es' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
    })
  }
  const [y, m] = String(key).split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  if (Number.isNaN(d.getTime())) return key
  return d.toLocaleDateString(locale.value === 'es' ? 'es' : 'en-US', {
    month: 'short',
    year: 'numeric',
  })
}

const hasData = computed(() => Array.isArray(series.value) && series.value.length > 0)
</script>

<template>
  <div class="sf-analytics-card sf-analytics-card-light">
    <div class="sf-analytics-card-head">
      <h2 class="sf-analytics-card-title">{{ t('bounded.analytics.chart.title') }}</h2>
      <pv-select
        v-model="period"
        :options="periodOptions"
        option-label="label"
        option-value="value"
        class="sf-analytics-chart-select"
      />
    </div>
    <div
      v-if="hasData"
      class="sf-analytics-chart-bars"
      role="img"
      :aria-label="t('bounded.analytics.chart.title')"
    >
      <div v-for="bar in series" :key="bar.key" class="sf-analytics-chart-col">
        <div class="sf-analytics-chart-col-track">
          <div
            class="sf-analytics-chart-col-fill"
            :style="{ height: `${(bar.value / maxVal) * 100}%` }"
          />
        </div>
        <span class="sf-analytics-chart-col-val">{{ bar.value }}</span>
        <span class="sf-analytics-chart-col-label">{{ barLabel(bar.key) }}</span>
      </div>
    </div>
    <div
      v-else
      class="sf-analytics-chart-plot"
      role="img"
      :aria-label="t('bounded.analytics.chart.placeholderHint')"
    >
      <p class="sf-analytics-chart-hint">{{ t('bounded.analytics.chart.placeholderHint') }}</p>
    </div>
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

.sf-analytics-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.sf-analytics-card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--sf-ui-text);
}

.sf-analytics-chart-select {
  min-width: 160px;
}

.sf-analytics-chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  min-height: 220px;
  padding: 8px 0 0;
}

.sf-analytics-chart-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.sf-analytics-chart-col-track {
  width: 100%;
  max-width: 48px;
  height: 160px;
  margin: 0 auto;
  border-radius: 6px;
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}

.sf-analytics-chart-col-fill {
  width: 100%;
  min-height: 2px;
  border-radius: 6px 6px 0 0;
  background: linear-gradient(180deg, #60a5fa, #2563eb);
  transition: height 0.25s ease;
}

.sf-analytics-chart-col-val {
  font-size: 12px;
  font-weight: 700;
  color: var(--sf-ui-text);
  font-variant-numeric: tabular-nums;
}

.sf-analytics-chart-col-label {
  font-size: 10px;
  color: #64748b;
  text-align: center;
  line-height: 1.2;
  max-width: 100%;
  word-break: break-word;
}

.sf-analytics-chart-plot {
  min-height: 220px;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sf-analytics-chart-hint {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}
</style>
