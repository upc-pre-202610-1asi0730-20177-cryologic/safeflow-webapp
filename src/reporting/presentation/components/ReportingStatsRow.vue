<script setup>
import { Truck, Package, Thermometer, Bell, FileBarChart } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

defineProps({
  items: {
    type: Array,
    required: true,
  },
})

const { t } = useI18n()

/** Icono por métrica (ids del agregado `reporting-dashboard`). */
const statIcons = {
  a1: Truck,
  a2: Package,
  a3: Thermometer,
  a4: Bell,
}

function statVariant(id) {
  const map = {
    a1: 'sf-rep-stat--logistics',
    a2: 'sf-rep-stat--inventory',
    a3: 'sf-rep-stat--thermal',
    a4: 'sf-rep-stat--alerts',
  }
  return map[id] ?? 'sf-rep-stat--default'
}

function statIcon(id) {
  return statIcons[id] ?? FileBarChart
}
</script>

<template>
  <div class="sf-rep-stats sf-rep-stats--light">
    <article v-for="s in items" :key="s.id" class="sf-rep-stat" :class="statVariant(s.id)">
      <span class="sf-rep-stat__icon-wrap" aria-hidden="true">
        <component :is="statIcon(s.id)" class="sf-rep-stat__icon" />
      </span>
      <p class="sf-rep-stat__label">{{ t(s.labelKey) }}</p>
      <p v-if="s.valueKind === 'number'" class="sf-rep-stat__value">{{ s.value?.toLocaleString() }}</p>
      <p v-else class="sf-rep-stat__value sf-rep-stat__value--text">{{ t(s.textKey) }}</p>
    </article>
  </div>
</template>

<style scoped>
.sf-rep-stats {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.sf-rep-stats--light {
  color-scheme: light;
}

@media (max-width: 960px) {
  .sf-rep-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .sf-rep-stats {
    grid-template-columns: 1fr;
  }
}

.sf-rep-stat {
  position: relative;
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
  .sf-rep-stat:hover {
    transform: translateY(-2px);
    border-color: #e2e8f0;
    box-shadow:
      0 4px 14px -4px rgba(15, 23, 42, 0.12),
      0 1px 3px rgba(15, 23, 42, 0.05);
  }
}

.sf-rep-stat__icon-wrap {
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

.sf-rep-stat__icon {
  width: 23px;
  height: 23px;
  stroke-width: 2.35px;
}

/* Color vívido solo en el icono; sin barra superior en la tarjeta */
.sf-rep-stat--logistics .sf-rep-stat__icon {
  color: #2563eb;
}

.sf-rep-stat--logistics .sf-rep-stat__icon-wrap {
  background: linear-gradient(160deg, #dbeafe 0%, #eff6ff 100%);
  border-color: rgb(37 99 235 / 0.28);
}

.sf-rep-stat--inventory .sf-rep-stat__icon {
  color: #7c3aed;
}

.sf-rep-stat--inventory .sf-rep-stat__icon-wrap {
  background: linear-gradient(160deg, #ddd6fe 0%, #f5f3ff 100%);
  border-color: rgb(124 58 237 / 0.3);
}

.sf-rep-stat--thermal .sf-rep-stat__icon {
  color: #0d9488;
}

.sf-rep-stat--thermal .sf-rep-stat__icon-wrap {
  background: linear-gradient(160deg, #99f6e4 0%, #ecfdf5 100%);
  border-color: rgb(13 148 136 / 0.32);
}

.sf-rep-stat--alerts .sf-rep-stat__icon {
  color: #e11d48;
}

.sf-rep-stat--alerts .sf-rep-stat__icon-wrap {
  background: linear-gradient(160deg, #fecdd3 0%, #fff1f2 100%);
  border-color: rgb(225 29 72 / 0.32);
}

.sf-rep-stat--default .sf-rep-stat__icon {
  color: #475569;
}

.sf-rep-stat--default .sf-rep-stat__icon-wrap {
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.sf-rep-stat__label {
  margin: 0 0 4px;
  width: 100%;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  line-height: 1.35;
}

.sf-rep-stat__value {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
  line-height: 1.15;
}

.sf-rep-stat__value--text {
  font-size: 18px;
  font-weight: 600;
}
</style>
