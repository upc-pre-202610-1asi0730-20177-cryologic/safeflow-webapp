<script setup>
import { MapPin, ArrowRight, CheckCircle2, AlertTriangle, Warehouse } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useLogisticsStore } from '../../application/logistics.store.js'
import { useEnvironmentalMonitoringStore } from '@/environmental-monitoring/application/monitoring.store.js'
import { useShipmentLocaleText } from '../use-shipment-locale.js'
import { findMonitorCardForShipment } from '../use-shipment-monitor-card.js'
import { isTemperatureOutOfRange } from '@/shared/domain/thermal-range.js'
import ShipmentStatusPill from '@/shared/presentation/components/ShipmentStatusPill.vue'

const { t } = useI18n()
const { loc } = useShipmentLocaleText()
const logistics = useLogisticsStore()
const monitoring = useEnvironmentalMonitoringStore()
const { shipments, selectedId } = storeToRefs(logistics)
const { monitorCards } = storeToRefs(monitoring)

function liveCardForShipment(data) {
  return findMonitorCardForShipment(data, monitorCards.value)
}

function formatTempCell(n) {
  return `${Number(n).toFixed(1)}°C`
}

/** Si hay tarjeta de monitoreo del producto, usar su estado/°C (almacén, pendiente o tránsito). */
function thermalCellSafe(data) {
  const card = liveCardForShipment(data)
  if (card != null) {
    if (card.status === 'warning') return false
    return !isTemperatureOutOfRange(card.currentTemp, card.rangeMin, card.rangeMax)
  }
  return data.thermal === 'safe'
}

function thermalCellLabel(data) {
  const card = liveCardForShipment(data)
  if (card != null && Number.isFinite(Number(card.currentTemp))) {
    return formatTempCell(card.currentTemp)
  }
  const temp = data.currentTemp
  if (temp != null && Number.isFinite(Number(temp))) {
    return formatTempCell(temp)
  }
  return t(`bounded.logistics.thermal.${data.thermal}`)
}

function rowClass(data) {
  return data.id === selectedId.value ? 'sf-log-table__row--selected' : null
}

function onRowClick(event) {
  logistics.selectShipment(event.data.id)
}

</script>

<template>
  <div class="sf-log-table-panel sf-log-table-panel--light">
    <h2 class="sf-log-table-panel__title">{{ t('bounded.logistics.allShipmentsTitle') }}</h2>
    <div class="sf-log-table-panel__scroll">
      <pv-data-table
          :value="shipments"
          data-key="id"
          striped-rows
          row-hover
          class="sf-log-table"
          :table-style="{ width: '100%' }"
          :row-class="rowClass"
          @row-click="onRowClick"
      >
        <pv-column :header="t('bounded.logistics.tableCol.product')" style="width: 39%">
          <template #body="{ data }">
            <div class="sf-log-cell-product">
              <div class="sf-log-cell-product__top">
                <span class="sf-log-cell-product__id">{{ data.id }}</span>
                <span class="sf-log-cell-product__sep" aria-hidden="true">·</span>
                <span class="sf-log-cell-product__name">{{ loc(data.product) }}</span>
              </div>
              <span class="sf-log-cell-product__driver">{{ loc(data.carrier) }}</span>
            </div>
          </template>
        </pv-column>
        <pv-column :header="t('bounded.logistics.tableCol.placement')" style="width: 33%">
          <template #body="{ data }">
            <div v-if="data.placementKind === 'warehouse'" class="sf-log-placement sf-log-placement--warehouse">
              <Warehouse class="sf-log-placement__icon" aria-hidden="true" />
              <span class="sf-log-placement__text">{{ loc(data.routeFrom) }}</span>
            </div>
            <div v-else class="sf-log-route">
              <MapPin class="sf-log-route__pin" aria-hidden="true" />
              <span class="sf-log-route__text">{{ loc(data.routeFrom) }}</span>
              <ArrowRight class="sf-log-route__arrow" aria-hidden="true" />
              <span class="sf-log-route__text">{{ loc(data.routeTo) }}</span>
            </div>
          </template>
        </pv-column>
        <pv-column :header="t('bounded.logistics.tableCol.status')" style="width: 13%">
          <template #body="{ data }">
            <ShipmentStatusPill
                :status="data.status"
                :label="t(`bounded.logistics.shipmentStatus.${data.status}`)"
            />
          </template>
        </pv-column>
        <pv-column :header="t('bounded.logistics.tableCol.thermal')" style="width: 15%">
          <template #body="{ data }">
            <span class="sf-log-thermal" :class="thermalCellSafe(data) ? 'sf-log-thermal--safe' : 'sf-log-thermal--risk'">
              <CheckCircle2 v-if="thermalCellSafe(data)" class="sf-log-thermal__icon" aria-hidden="true" />
              <AlertTriangle v-else class="sf-log-thermal__icon" aria-hidden="true" />
              <span class="sf-log-thermal__value">{{ thermalCellLabel(data) }}</span>
            </span>
          </template>
        </pv-column>
      </pv-data-table>
    </div>
  </div>
</template>

<style scoped>
.sf-log-table-panel {
  width: 100%;
  min-width: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow:
      0 1px 2px rgba(15, 23, 42, 0.04),
      0 4px 16px rgba(15, 23, 42, 0.06);
  padding: 20px 22px 22px;
}

.sf-log-table-panel--light {
  color-scheme: light;
}

.sf-log-table-panel__title {
  margin: 0 0 16px;
  font-family: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
  font-size: clamp(18px, 1.65vw, 24px);
  font-weight: 700;
  color: var(--sf-ui-text);
  letter-spacing: -0.02em;
}

.sf-log-table-panel__scroll {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  margin: 0 -2px;
  padding: 0 2px;
}

.sf-log-table-panel :deep(.p-datatable),
.sf-log-table-panel :deep(.p-datatable-table-container) {
  width: 100%;
}

.sf-log-table-panel :deep(.p-datatable-table) {
  width: 100%;
  table-layout: fixed;
}

.sf-log-table-panel :deep(.p-datatable-tbody > tr) {
  background: #fff !important;
  cursor: pointer;
}

.sf-log-table-panel :deep(.p-datatable-striped .p-datatable-tbody > tr.p-row-odd) {
  background: #fafbfc !important;
}

.sf-log-table-panel :deep(.p-datatable-tbody > tr.sf-log-table__row--selected) {
  background: #dbeafe !important;
  box-shadow: inset 4px 0 0 0 #1d4ed8;
}

.sf-log-table-panel :deep(.p-datatable-tbody > tr > td) {
  border-color: #f1f5f9 !important;
  padding: 13px 16px;
  vertical-align: middle;
  font-size: 15px;
  line-height: 1.45;
}

.sf-log-table-panel :deep(.p-datatable-thead > tr > th) {
  padding: 12px 16px;
  font-family: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  background: #fff !important;
  border-color: #e5e7eb !important;
  border-bottom-width: 1px !important;
}

.sf-log-table-panel :deep(.p-datatable-hoverable .p-datatable-tbody > tr:not(.p-datatable-row-selected):hover) {
  background: #f8fafc !important;
}

.sf-log-table-panel :deep(.p-datatable-thead > tr > th:nth-child(3)),
.sf-log-table-panel :deep(.p-datatable-tbody > tr > td:nth-child(3)) {
  text-align: center;
}

.sf-log-table-panel :deep(.p-datatable-thead > tr > th:nth-child(4)),
.sf-log-table-panel :deep(.p-datatable-tbody > tr > td:nth-child(4)) {
  text-align: end;
}

.sf-log-cell-product {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.sf-log-cell-product__top {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}

.sf-log-cell-product__id {
  font-size: 13px;
  font-weight: 700;
  font-family: 'Inter', system-ui, sans-serif;
  font-variant-numeric: tabular-nums;
  color: #475569;
  flex-shrink: 0;
}

.sf-log-cell-product__sep {
  color: #cbd5e1;
  font-weight: 400;
  user-select: none;
}

.sf-log-cell-product__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--sf-ui-text);
  line-height: 1.35;
  min-width: 0;
}

.sf-log-cell-product__driver {
  font-size: 13px;
  color: #64748b;
  line-height: 1.35;
}

.sf-log-route {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 15px;
  color: #334155;
  min-width: 0;
}

.sf-log-route__pin {
  width: 15px;
  height: 15px;
  color: #94a3b8;
  flex-shrink: 0;
}

.sf-log-route__arrow {
  width: 15px;
  height: 15px;
  color: #cbd5e1;
  flex-shrink: 0;
}

.sf-log-route__text {
  line-height: 1.35;
  word-break: break-word;
}

.sf-log-placement {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 15px;
  color: #334155;
  min-width: 0;
}

.sf-log-placement__icon {
  width: 15px;
  height: 15px;
  color: #64748b;
  flex-shrink: 0;
  margin-top: 2px;
}

.sf-log-placement__text {
  line-height: 1.4;
  word-break: break-word;
  font-weight: 500;
}

.sf-log-thermal {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  max-width: 100%;
  padding: 5px 9px;
  border-radius: 6px;
  border: 1px solid transparent;
}

.sf-log-thermal--safe {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #047857;
}

.sf-log-thermal--risk {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.sf-log-thermal__icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.92;
}

.sf-log-thermal__value {
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}
</style>
