<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAlertsStore } from '@/alerts/application/alerts.store.js'
import { useEnvironmentalMonitoringStore } from '@/environmental-monitoring/application/monitoring.store.js'
import Sidebar from './sidebar.vue'
import Topbar from './topbar.vue'
import ThermalSimulationFab from './ThermalSimulationFab.vue'

const sidebarCollapsed = ref(false)
const route = useRoute()
/** Inter + escala tipo dashboard: analítica, inventario, logística, monitoreo, alertas e informes. */
const isDashboardTypography = computed(
  () =>
    route.path.startsWith('/analytics') ||
    route.path.startsWith('/inventory') ||
    route.path.startsWith('/logistics') ||
    route.path.startsWith('/environmental-monitoring') ||
    route.path.startsWith('/alerts') ||
    route.path.startsWith('/reporting'),
)
const alerts = useAlertsStore()
const monitoring = useEnvironmentalMonitoringStore()

watch(
  () => monitoring.monitorCards,
  () => {
    alerts.rebuildThermalFeed()
  },
  { deep: true },
)

watch(
  () => monitoring.thermalPausedAlertIds,
  () => {
    alerts.rebuildThermalFeed()
  },
  { deep: true },
)
</script>

<template>
  <pv-toast />
  <pv-confirm-dialog />
  <ThermalSimulationFab />
  <div class="sf-shell">
    <Sidebar
      :collapsed="sidebarCollapsed"
      @toggle-sidebar="sidebarCollapsed = !sidebarCollapsed"
    />
    <div class="sf-main" :class="{ 'sf-main--dash-typography': isDashboardTypography }">
      <Topbar />
      <main class="sf-content" :class="{ 'sf-content--dash-typography': isDashboardTypography }">
        <!--
          Sin mode="out-in": con vistas lazy, out-in deja el outlet vacío hasta que carga el chunk;
          si hay retraso o error, la zona principal queda en blanco ("como que no se recarga").
        -->
        <router-view v-slot="{ Component }">
          <transition name="sf-fade">
            <component :is="Component" v-if="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.sf-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f8fafc;
  color: var(--sf-ui-text);
  font-family: system-ui, 'Segoe UI', Roboto, sans-serif;
}

.sf-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/**
 * Escala dashboard (recomendada en px vía clamp):
 * Títulos 28–36 · Subtítulos 18–24 · Cuerpo 14–16 · Tablas 12–14
 */
.sf-main--dash-typography {
  --sf-dash-title: clamp(28px, 3vw, 36px);
  --sf-dash-subtitle: clamp(18px, 1.65vw, 24px);
  --sf-dash-body: clamp(14px, 0.9vw, 16px);
  --sf-dash-table: clamp(12px, 0.75vw, 14px);
  --sf-dash-kpi-value: clamp(20px, 2.4vw, 24px);
  /** Título tarjeta monitoreo: un punto por debajo del subtítulo global */
  --sf-dash-mon-card-title: clamp(15px, 1.2vw, 19px);
  font-family: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
}

.sf-main--dash-typography :deep(.p-datatable-thead > tr > th) {
  font-size: var(--sf-dash-table) !important;
  font-weight: 600;
}

.sf-main--dash-typography :deep(.p-datatable-tbody > tr > td) {
  font-size: var(--sf-dash-table) !important;
}

.sf-main--dash-typography :deep(.sf-ship-status) {
  font-size: var(--sf-dash-table) !important;
}

.sf-main--dash-typography :deep(.sf-kpi__title) {
  font-size: var(--sf-dash-table) !important;
}

.sf-main--dash-typography :deep(.sf-kpi__value) {
  font-size: var(--sf-dash-kpi-value) !important;
}

.sf-main--dash-typography :deep(.sf-rep-section-title),
.sf-main--dash-typography :deep(.sf-log-table-panel__title),
.sf-main--dash-typography :deep(.sf-log-track__title) {
  font-size: var(--sf-dash-subtitle) !important;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.sf-main--dash-typography :deep(.sf-mon-card__title) {
  font-size: var(--sf-dash-mon-card-title) !important;
  font-weight: 600 !important;
  letter-spacing: -0.012em;
}

.sf-main--dash-typography :deep(.sf-alert-card__title) {
  font-size: var(--sf-dash-subtitle) !important;
}

.sf-main--dash-typography :deep(.sf-mon-card__meta-dt) {
  font-size: var(--sf-dash-table) !important;
}

.sf-main--dash-typography :deep(.sf-mon-card__meta-dd),
.sf-main--dash-typography :deep(.sf-mon-card__foot) {
  font-size: var(--sf-dash-table) !important;
}

.sf-main--dash-typography :deep(.sf-alert-card__meta),
.sf-main--dash-typography :deep(.sf-alert-card__status) {
  font-size: var(--sf-dash-body) !important;
}

/** Subpantallas (logística, inventario): título de pantalla bajo el módulo en topbar (escala subtítulo). */
.sf-main--dash-typography :deep(.sf-log-subpage__intro) {
  margin: 0 0 16px;
  padding: 0;
}

.sf-main--dash-typography :deep(.sf-log-subpage__page-title) {
  margin: 0;
  font-size: var(--sf-dash-subtitle) !important;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.3;
  color: var(--sf-ui-text);
}

.sf-content {
  flex: 1;
  overflow: auto;
  padding: 24px;
}

.sf-content--dash-typography {
  font-family: inherit;
  font-size: var(--sf-dash-body);
  line-height: 1.5;
  color: var(--sf-ui-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.sf-content--dash-typography :deep(.inv-title) {
  font-family: inherit;
  font-size: var(--sf-dash-subtitle);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.sf-content--dash-typography :deep(.inv-card-head .inv-title) {
  margin: 0 0 6px;
}

.sf-content--dash-typography :deep(.inv-intro) {
  margin: 0 0 20px;
  max-width: 672px;
  font-size: var(--sf-dash-body);
  font-weight: 400;
  line-height: 1.5;
  color: #64748b;
  letter-spacing: 0;
}

.sf-content--dash-typography :deep(.sf-lns__card-head .sf-lns__title) {
  margin: 0 0 6px;
  font-family: inherit;
  font-size: var(--sf-dash-subtitle);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.sf-content--dash-typography :deep(.sf-lns__page-desc) {
  margin: 0 0 20px;
  max-width: 672px;
  font-size: var(--sf-dash-body);
  font-weight: 400;
  line-height: 1.5;
  color: #64748b;
  letter-spacing: 0;
}

.sf-content--dash-typography :deep(.sf-lnd__card-head .sf-lnd__title) {
  margin: 0 0 6px;
  font-family: inherit;
  font-size: var(--sf-dash-subtitle);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.sf-content--dash-typography :deep(.sf-lnd__page-desc) {
  margin: 0;
  max-width: 672px;
  font-size: var(--sf-dash-body);
  font-weight: 400;
  line-height: 1.5;
  color: #64748b;
  letter-spacing: 0;
}

.sf-content--dash-typography :deep(.sf-ldrv__card-head .sf-ldrv__title) {
  margin: 0 0 6px;
  font-family: inherit;
  font-size: var(--sf-dash-subtitle);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.sf-content--dash-typography :deep(.sf-ldrv__page-desc) {
  margin: 0;
  max-width: 672px;
  font-size: var(--sf-dash-body);
  font-weight: 400;
  line-height: 1.5;
  color: #64748b;
  letter-spacing: 0;
}

.sf-content--dash-typography :deep(.sf-lns__route-hint) {
  font-size: var(--sf-dash-table) !important;
  line-height: 1.35 !important;
  padding: 5px 7px !important;
}

.sf-content--dash-typography :deep(.inv-callout) {
  font-size: var(--sf-dash-body);
  line-height: 1.55;
}

.sf-content--dash-typography :deep(.inv-label) {
  font-size: var(--sf-dash-body);
}

.sf-content--dash-typography :deep(.inv-input),
.sf-content--dash-typography :deep(.inv-input-select),
.sf-content--dash-typography :deep(.inv-input-num),
.sf-content--dash-typography :deep(.inv-date) {
  font-size: var(--sf-dash-body);
}

.sf-content--dash-typography :deep(.inv-btn-cancel),
.sf-content--dash-typography :deep(.inv-btn-save) {
  font-size: var(--sf-dash-body);
}

.sf-content--dash-typography :deep(.p-button) {
  font-family: inherit;
  font-size: var(--sf-dash-body);
  font-weight: 600;
}

.sf-fade-enter-active,
.sf-fade-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.sf-fade-enter-from,
.sf-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
