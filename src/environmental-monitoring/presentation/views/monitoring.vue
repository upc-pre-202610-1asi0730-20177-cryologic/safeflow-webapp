<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useEnvironmentalMonitoringStore } from '../../application/monitoring.store.js'
import ColdChainKpiGrid from '@/shared/presentation/components/cold-chain/ColdChainKpiGrid.vue'
import ColdChainMonitorGrid from '@/shared/presentation/components/cold-chain/ColdChainMonitorGrid.vue'

const monitoring = useEnvironmentalMonitoringStore()
const { kpis, monitorCards, simulationActive } = storeToRefs(monitoring)

onMounted(() => {
  // Siempre sincronizar con el `db.json` del servidor de desarrollo: el bundle importa un snapshot
  // estático y Pinia puede conservar tarjetas viejas al volver desde Inventario.
  void monitoring.resyncFromServer()
})
</script>

<template>
  <div class="sf-env-page">
    <ColdChainKpiGrid :items="kpis" />

    <ColdChainMonitorGrid
      :cards="monitorCards"
      :simulation-active="simulationActive"
      monitor-locale-prefix="bounded.environmental.monitorCards"
    />
  </div>
</template>

<style scoped>
.sf-env-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 100%;
}
</style>
