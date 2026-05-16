<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { CheckCircle2, AlertTriangle } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useEnvironmentalMonitoringStore } from '@/environmental-monitoring/application/monitoring.store.js'
import { useShipmentLocaleText } from '../use-shipment-locale.js'
import { findMonitorCardForShipment } from '../use-shipment-monitor-card.js'
import { isTemperatureOutOfRange } from '@/shared/domain/thermal-range.js'
import ShipmentStatusPill from '@/shared/presentation/components/ShipmentStatusPill.vue'

const props = defineProps({
  shipment: {
    type: Object,
    default: null,
  },
})

const { t } = useI18n()
const { loc } = useShipmentLocaleText()
const monitoring = useEnvironmentalMonitoringStore()
const { monitorCards, simulationActive } = storeToRefs(monitoring)

/** Tarjeta de monitoreo del envío (por id envío → inventario → producto). */
const liveMonitorCard = computed(() =>
    findMonitorCardForShipment(props.shipment, monitorCards.value),
)

const displayTemp = computed(() => {
  const card = liveMonitorCard.value
  if (card != null && Number.isFinite(Number(card.currentTemp))) {
    return Number(card.currentTemp)
  }
  const temp = props.shipment?.currentTemp
  return temp != null && Number.isFinite(Number(temp)) ? Number(temp) : null
})

const displayThermalSafe = computed(() => {
  const card = liveMonitorCard.value
  if (card != null) {
    if (card.status === 'warning') return false
    return !isTemperatureOutOfRange(card.currentTemp, card.rangeMin, card.rangeMax)
  }
  const t = displayTemp.value
  return props.shipment?.thermal === 'safe' && t != null
})

const allowedRange = computed(() => {
  const card = liveMonitorCard.value
  if (!card) return null
  const lo = Number(card.rangeMin)
  const hi = Number(card.rangeMax)
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return null
  return { min: lo, max: hi }
})

const showThermal = computed(() => props.shipment != null && displayTemp.value != null)

const syncedWithMonitoring = computed(() => liveMonitorCard.value != null)

function formatTemp(n) {
  return `${Number(n).toFixed(1)}°C`
}
</script>

<template>
  <div class="sf-log-track sf-log-track--light">
    <h2 class="sf-log-track__title">{{ t('bounded.logistics.activeRouteTitle') }}</h2>

    <div v-if="!shipment" class="sf-log-track__empty">
      {{ t('bounded.logistics.selectShipment') }}
    </div>

    <template v-else>
      <div class="sf-log-track__card">
        <div class="sf-log-track__card-head">
          <span class="sf-log-track__sid">{{ shipment.id }}</span>
          <ShipmentStatusPill
              :status="shipment.status"
              :label="t(`bounded.logistics.shipmentStatus.${shipment.status}`)"
          />
        </div>
        <p class="sf-log-track__product">{{ loc(shipment.product) }}</p>
        <p class="sf-log-track__provider">{{ loc(shipment.providerLine) }}</p>
      </div>

      <div class="sf-log-timeline">
        <div class="sf-log-timeline__item">
          <span class="sf-log-timeline__dot" />
          <div class="sf-log-timeline__body">
            <p class="sf-log-timeline__label">
              {{
                shipment.placementKind === 'warehouse'
                    ? t('bounded.logistics.timeline.warehouseSlot')
                    : t('bounded.logistics.timeline.origin')
              }}
            </p>
            <p class="sf-log-timeline__place">{{ loc(shipment.originPlace) }}</p>
            <p class="sf-log-timeline__time">{{ loc(shipment.originTime) }}</p>
          </div>
        </div>

        <div
            class="sf-log-timeline__item sf-log-timeline__item--current"
            :class="{ 'sf-log-timeline__item--last': shipment.placementKind === 'warehouse' }"
        >
          <span class="sf-log-timeline__dot sf-log-timeline__dot--accent" />
          <div class="sf-log-timeline__body">
            <p class="sf-log-timeline__label">{{ t('bounded.logistics.timeline.current') }}</p>
            <p class="sf-log-timeline__place">{{ loc(shipment.currentPlace) }}</p>
            <div
                v-if="showThermal"
                class="sf-log-thermal"
                :class="displayThermalSafe ? 'sf-log-thermal--safe' : 'sf-log-thermal--risk'"
            >
              <CheckCircle2 v-if="displayThermalSafe" class="sf-log-thermal__icon" />
              <AlertTriangle v-else class="sf-log-thermal__icon" />
              <div>
                <p class="sf-log-thermal__title">{{ t('bounded.logistics.thermal.boxTitle') }}</p>
                <p class="sf-log-thermal__temp">
                  {{ t('bounded.logistics.thermal.currentTemp', { value: formatTemp(displayTemp) }) }}
                </p>
                <p v-if="allowedRange" class="sf-log-thermal__range">
                  {{
                    t('bounded.logistics.thermal.allowedRange', {
                      min: formatTemp(allowedRange.min),
                      max: formatTemp(allowedRange.max),
                    })
                  }}
                </p>
                <p v-if="syncedWithMonitoring && simulationActive" class="sf-log-thermal__live">
                  {{ t('bounded.logistics.thermal.liveHint') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="shipment.placementKind !== 'warehouse'" class="sf-log-timeline__item sf-log-timeline__item--last">
          <span class="sf-log-timeline__dot" />
          <div class="sf-log-timeline__body">
            <p class="sf-log-timeline__label">{{ t('bounded.logistics.timeline.destination') }}</p>
            <p class="sf-log-timeline__place">{{ loc(shipment.destPlace) }}</p>
            <p class="sf-log-timeline__time">{{ loc(shipment.destTime) }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.sf-log-track {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow:
      0 1px 2px rgba(15, 23, 42, 0.04),
      0 4px 16px rgba(15, 23, 42, 0.06);
  padding: 20px 22px 22px;
  height: fit-content;
}

.sf-log-track--light {
  color-scheme: light;
}

.sf-log-track__title {
  margin: 0 0 16px;
  font-family: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
  font-size: clamp(18px, 1.65vw, 24px);
  font-weight: 700;
  color: var(--sf-ui-text);
  letter-spacing: -0.02em;
}

.sf-log-track__empty {
  font-size: 15px;
  color: #64748b;
  padding: 16px 0;
}

.sf-log-track__card {
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.sf-log-track__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.sf-log-track__sid {
  font-size: 15px;
  font-weight: 700;
  font-family: 'Inter', system-ui, sans-serif;
  font-variant-numeric: tabular-nums;
  color: var(--sf-ui-text);
}

.sf-log-track__product {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: var(--sf-ui-text);
}

.sf-log-track__provider {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.sf-log-timeline {
  position: relative;
  padding-left: 4px;
}

.sf-log-timeline__item {
  position: relative;
  padding-left: 24px;
  padding-bottom: 20px;
}

.sf-log-timeline__item:not(.sf-log-timeline__item--last)::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 8px;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
}

.sf-log-timeline__dot {
  position: absolute;
  left: 0;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #cbd5e1;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #e5e7eb;
}

.sf-log-timeline__dot--accent {
  background: #1d4ed8;
  box-shadow: 0 0 0 1px #3b82f6;
}

.sf-log-timeline__label {
  margin: 0 0 2px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
}

.sf-log-timeline__place {
  margin: 0 0 2px;
  font-size: 15px;
  font-weight: 600;
  color: var(--sf-ui-text);
}

.sf-log-timeline__time {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.sf-log-thermal {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
}

.sf-log-thermal--safe {
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.sf-log-thermal--risk {
  background: #fef2f2;
  border-color: #fecaca;
}

.sf-log-thermal__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}

.sf-log-thermal--safe .sf-log-thermal__icon {
  color: #059669;
}

.sf-log-thermal--risk .sf-log-thermal__icon {
  color: #dc2626;
}

.sf-log-thermal__title {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 700;
  color: var(--sf-ui-text);
}

.sf-log-thermal__temp {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.sf-log-thermal--safe .sf-log-thermal__temp {
  color: #059669;
}

.sf-log-thermal--risk .sf-log-thermal__temp {
  color: #dc2626;
}

.sf-log-thermal__range {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.sf-log-thermal__live {
  margin: 6px 0 0;
  font-size: 11px;
  font-weight: 600;
  color: #2563eb;
  letter-spacing: 0.02em;
}
</style>
