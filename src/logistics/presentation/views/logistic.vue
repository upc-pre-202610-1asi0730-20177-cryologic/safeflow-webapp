<script setup>
import { onActivated, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useEnvironmentalMonitoringStore } from '@/environmental-monitoring/application/monitoring.store.js'
import { useLogisticsStore } from '../../application/logistics.store.js'
import LogisticsTrackingPanel from '../components/LogisticsTrackingPanel.vue'
import LogisticsShipmentsTable from '../components/LogisticsShipmentsTable.vue'

const { t } = useI18n()
const router = useRouter()
const logistics = useLogisticsStore()
const monitoring = useEnvironmentalMonitoringStore()
const { selectedShipment } = storeToRefs(logistics)

function goNewDestination() {
  router.push({ name: 'logistics-add-destination' })
}

function goNewDriver() {
  router.push({ name: 'logistics-add-driver' })
}

function goNewShipment() {
  router.push({ name: 'logistics-add-shipment' })
}

function refreshLogistics() {
  logistics.loadTracking()
  // Con simulación activa, no forzar: las lecturas deben seguir iguales en monitoreo, logística y alertas.
  void monitoring.loadDashboard({ force: !monitoring.simulationActive })
}

onMounted(() => {
  refreshLogistics()
})

onActivated(() => {
  refreshLogistics()
})
</script>

<template>
  <div class="sf-logistics-page">
    <header class="sf-logistics-page__header">
      <div class="sf-logistics-page__actions">
        <pv-button
            class="sf-logistics-page__secondary"
            severity="secondary"
            outlined
            :label="t('bounded.logistics.newDestination')"
            @click="goNewDestination"
        />
        <pv-button
            class="sf-logistics-page__secondary"
            severity="secondary"
            outlined
            :label="t('bounded.logistics.newDriver')"
            @click="goNewDriver"
        />
        <pv-button
            class="sf-logistics-page__new"
            :label="t('bounded.logistics.newShipment')"
            icon="pi pi-plus"
            @click="goNewShipment"
        />
      </div>
    </header>

    <div class="sf-logistics-page__layout">
      <aside class="sf-logistics-page__aside">
        <LogisticsTrackingPanel :shipment="selectedShipment" />
      </aside>
      <main class="sf-logistics-page__main">
        <LogisticsShipmentsTable />
      </main>
    </div>
  </div>
</template>

<style scoped>
.sf-logistics-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 100%;
}

.sf-logistics-page__header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px 24px;
  flex-wrap: wrap;
}

.sf-logistics-page__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.sf-logistics-page__layout {
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr;
  align-items: start;
}

@media (min-width: 1024px) {
  .sf-logistics-page__layout {
    grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  }
}

.sf-logistics-page__aside {
  min-width: 0;
}

.sf-logistics-page__main {
  min-width: 0;
}

.sf-logistics-page__secondary {
  font-weight: 600 !important;
  padding-inline: 16px !important;
  padding-block: 10px !important;
  border-color: #cbd5e1 !important;
  color: var(--sf-ui-text) !important;
  background: #fff !important;
  border-radius: 8px !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.sf-logistics-page__secondary:not(:disabled):hover {
  background: #f8fafc !important;
  border-color: #94a3b8 !important;
  color: var(--sf-ui-text) !important;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.07);
}

.sf-logistics-page__secondary:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.sf-logistics-page__new {
  background: #2563eb !important;
  border-color: #2563eb !important;
  color: #fff !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
  padding-inline: 16px !important;
  padding-block: 10px !important;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.25);
}

.sf-logistics-page__new:not(:disabled):hover {
  background: #1d4ed8 !important;
  border-color: #1d4ed8 !important;
}
</style>
