<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useEnvironmentalMonitoringStore } from '@/environmental-monitoring/application/monitoring.store.js'

const { t } = useI18n()
const monitoring = useEnvironmentalMonitoringStore()
const { simulationActive } = storeToRefs(monitoring)

onMounted(() => {
  if (!monitoring.monitorCards.length) {
    void monitoring.loadDashboard({ force: true })
  }
})

async function onToggle() {
  await monitoring.toggleTemperatureSimulation()
}
</script>

<template>
  <!-- Misma acción que antes en monitoreo: sincroniza temperaturas en todos los módulos vía Pinia. -->
  <button
    type="button"
    class="sf-thermal-fab"
    :class="{ 'sf-thermal-fab--on': simulationActive }"
    :aria-label="t('bounded.environmental.simulation.secretAria')"
    :aria-pressed="simulationActive"
    :title="
      simulationActive
        ? t('bounded.environmental.simulation.secretTitleOn')
        : t('bounded.environmental.simulation.secretTitleOff')
    "
    @click="onToggle"
  >
    <i class="pi pi-plus sf-thermal-fab__icon" aria-hidden="true" />
  </button>
</template>

<style scoped>
.sf-thermal-fab {
  position: fixed;
  bottom: 16px;
  right: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 50%;
  background: linear-gradient(160deg, #5ec9be 0%, #26a69a 100%);
  color: #fff;
  cursor: pointer;
  z-index: 50;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.35) inset,
    0 10px 22px -8px rgba(15, 23, 42, 0.35),
    0 4px 10px -4px rgba(38, 166, 154, 0.45);
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sf-thermal-fab__icon {
  font-size: 18px;
  line-height: 1;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.12));
}

.sf-thermal-fab:hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.4) inset,
    0 14px 28px -8px rgba(15, 23, 42, 0.4),
    0 6px 14px -4px rgba(38, 166, 154, 0.5);
}

.sf-thermal-fab:focus-visible {
  outline: 3px solid rgba(77, 182, 172, 0.65);
  outline-offset: 3px;
}

.sf-thermal-fab:active {
  transform: translateY(0) scale(0.96);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.2) inset,
    0 4px 12px -4px rgba(15, 23, 42, 0.35),
    0 2px 6px -2px rgba(38, 166, 154, 0.35);
}

.sf-thermal-fab--on {
  background: linear-gradient(160deg, #00897b 0%, #00695c 100%);
  animation: sf-thermal-fab-pulse 2.2s ease-in-out infinite;
}

@keyframes sf-thermal-fab-pulse {
  0%,
  100% {
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.3) inset,
      0 10px 22px -8px rgba(15, 23, 42, 0.35),
      0 4px 10px -4px rgba(38, 166, 154, 0.45),
      0 0 0 0 rgba(77, 182, 172, 0.45);
  }
  50% {
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.3) inset,
      0 10px 22px -8px rgba(15, 23, 42, 0.35),
      0 4px 10px -4px rgba(38, 166, 154, 0.45),
      0 0 0 10px rgba(77, 182, 172, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sf-thermal-fab,
  .sf-thermal-fab:hover,
  .sf-thermal-fab:active {
    transition-duration: 0.01ms;
  }

  .sf-thermal-fab--on {
    animation: none;
  }
}
</style>
