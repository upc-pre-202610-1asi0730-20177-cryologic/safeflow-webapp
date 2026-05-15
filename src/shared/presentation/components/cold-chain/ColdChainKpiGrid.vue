<script setup>
import { Package, CheckCircle2, Truck, AlertTriangle } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

defineProps({
  items: {
    type: Array,
    required: true,
  },
})

const { t } = useI18n()

const iconMap = {
  package: Package,
  check: CheckCircle2,
  truck: Truck,
  alert: AlertTriangle,
}
</script>

<template>
  <div class="sf-kpi-grid sf-kpi-grid--light">
    <article v-for="k in items" :key="k.id" class="sf-kpi">
      <span class="sf-kpi__icon-wrap" :class="`sf-kpi__icon-wrap--${k.tone}`" aria-hidden="true">
        <component :is="iconMap[k.icon]" class="sf-kpi__icon" />
      </span>
      <p class="sf-kpi__title">{{ t(k.titleKey) }}</p>
      <p class="sf-kpi__value">{{ k.value.toLocaleString() }}</p>
    </article>
  </div>
</template>

<style scoped>
.sf-kpi-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.sf-kpi-grid--light {
  color-scheme: light;
}

@media (max-width: 1200px) {
  .sf-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .sf-kpi-grid {
    grid-template-columns: 1fr;
  }
}

.sf-kpi {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

@media (hover: hover) and (pointer: fine) {
  .sf-kpi:hover {
    transform: translateY(-2px);
    border-color: #e2e8f0;
    box-shadow:
      0 4px 14px -4px rgba(15, 23, 42, 0.12),
      0 1px 3px rgba(15, 23, 42, 0.05);
  }
}

.sf-kpi__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  margin-bottom: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.sf-kpi__icon {
  width: 23px;
  height: 23px;
  stroke-width: 2.35px;
}

/* Misma lógica visual que `ReportingStatsRow` (informes) */
.sf-kpi__icon-wrap--blue .sf-kpi__icon {
  color: #2563eb;
}

.sf-kpi__icon-wrap--blue {
  background: linear-gradient(160deg, #dbeafe 0%, #eff6ff 100%);
  border-color: rgb(37 99 235 / 0.28);
}

.sf-kpi__icon-wrap--green .sf-kpi__icon {
  color: #16a34a;
}

.sf-kpi__icon-wrap--green {
  background: linear-gradient(160deg, #bbf7d0 0%, #ecfdf5 100%);
  border-color: rgb(22 163 74 / 0.3);
}

.sf-kpi__icon-wrap--amber .sf-kpi__icon {
  color: #d97706;
}

.sf-kpi__icon-wrap--amber {
  background: linear-gradient(160deg, #fde68a 0%, #fffbeb 100%);
  border-color: rgb(217 119 6 / 0.32);
}

.sf-kpi__icon-wrap--rose .sf-kpi__icon {
  color: #e11d48;
}

.sf-kpi__icon-wrap--rose {
  background: linear-gradient(160deg, #fecdd3 0%, #fff1f2 100%);
  border-color: rgb(225 29 72 / 0.32);
}

.sf-kpi__title {
  margin: 0 0 4px;
  width: 100%;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  line-height: 1.35;
}

.sf-kpi__value {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
  line-height: 1.15;
}
</style>
