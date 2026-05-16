<script setup>
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { CheckCircle2, AlertTriangle, Thermometer, Pause, User, MapPin, Warehouse, IdCard } from 'lucide-vue-next'
import { useEnvironmentalMonitoringStore } from '@/environmental-monitoring/application/monitoring.store.js'
import { buildThermalAlertInstanceId } from '@/environmental-monitoring/domain/thermal-alert-instance-id.js'
import { isTemperatureOutOfRange } from '@/shared/domain/thermal-range.js'

defineProps({
  cards: {
    type: Array,
    default: () => [],
  },
})

const { t, locale } = useI18n()
const monitoring = useEnvironmentalMonitoringStore()
const { thermalPausedAlertIds } = storeToRefs(monitoring)

function isPaused(card) {
  const aid = buildThermalAlertInstanceId(card)
  return aid != null && thermalPausedAlertIds.value.includes(aid)
}

/** Rojo si la lectura actual está fuera del rango (aunque el estado en caché no se haya actualizado). */
function cardAtRisk(card) {
  if (isPaused(card)) return false
  if (card.status === 'warning') return true
  return isTemperatureOutOfRange(card.currentTemp, card.rangeMin, card.rangeMax)
}

function formatTemp(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return Number(n).toFixed(1)
}

function formatRange(c) {
  return `${formatTemp(c.rangeMin)} – ${formatTemp(c.rangeMax)}°C`
}

function locField(field) {
  if (field == null || typeof field !== 'object') return '—'
  const l = locale.value === 'es' ? 'es' : 'en'
  const s = l === 'es' ? field.es ?? field.en : field.en ?? field.es
  return s != null && String(s).trim() ? String(s).trim() : '—'
}

function destinationLine(c) {
  if (c.placementKind === 'warehouse') {
    return t('bounded.environmental.monitorCards.destWarehouseMode')
  }
  return locField(c.routeDestinationLoc)
}

function warehouseLine(c) {
  const wh = locField(c.warehouseSpotLoc)
  if (wh && wh !== '—') return wh
  return t('bounded.environmental.monitorCards.warehouseDash')
}

function roleLine(c) {
  const r = c.staffRole === 'conductor' || c.staffRole === 'operario' ? c.staffRole : 'none'
  return t(`bounded.environmental.monitorCards.role.${r}`)
}

function cardTitle(c) {
  const fromCatalog = locField(c.productNombre)
  const base = fromCatalog && fromCatalog !== '—' ? fromCatalog : t(c.titleKey)
  if (c.placementKind === 'route') {
    const dest = locField(c.routeDestinationLoc)
    if (dest && dest !== '—') {
      const sid = c.shipmentId != null && String(c.shipmentId).trim() ? String(c.shipmentId).trim() : ''
      return sid ? `${base} → ${dest} (#${sid})` : `${base} → ${dest}`
    }
  }
  const wh = locField(c.warehouseSpotLoc)
  if (base && wh && wh !== '—') return `${base} · ${wh}`
  const sid = c.shipmentId != null && String(c.shipmentId).trim() ? String(c.shipmentId).trim() : ''
  return sid ? `${base} (#${sid})` : base
}
</script>

<template>
  <div class="sf-mon-grid" role="list">
    <article
      v-for="c in cards"
      :key="c.id"
      class="sf-mon-card"
      :class="
        isPaused(c) ? 'sf-mon-card--paused' : cardAtRisk(c) ? 'sf-mon-card--risk' : 'sf-mon-card--safe'
      "
      role="listitem"
    >
      <header class="sf-mon-card__head">
        <h3 class="sf-mon-card__title">{{ cardTitle(c) }}</h3>
        <span v-if="isPaused(c)" class="sf-mon-card__pill sf-mon-card__pill--obs">
          <Pause class="sf-mon-card__pill-icon" aria-hidden="true" />
          {{ t('bounded.environmental.monitorCards.badge.observation') }}
        </span>
        <span
          v-else
          class="sf-mon-card__pill"
          :class="cardAtRisk(c) ? 'sf-mon-card__pill--risk' : 'sf-mon-card__pill--safe'"
        >
          <CheckCircle2 v-if="!cardAtRisk(c)" class="sf-mon-card__pill-icon" aria-hidden="true" />
          <AlertTriangle v-else class="sf-mon-card__pill-icon" aria-hidden="true" />
          {{
            t(
              cardAtRisk(c)
                ? 'bounded.environmental.monitorCards.badge.warning'
                : 'bounded.environmental.monitorCards.badge.safe',
            )
          }}
        </span>
      </header>

      <div class="sf-mon-card__body">
        <div class="sf-mon-card__readout-col">
          <div class="sf-mon-card__readout">
            <span class="sf-mon-card__temp">{{ formatTemp(c.currentTemp) }}</span>
            <span class="sf-mon-card__unit">°C</span>
          </div>
        </div>

        <dl class="sf-mon-card__meta">
          <div class="sf-mon-card__meta-row">
            <dt class="sf-mon-card__meta-dt">
              <User class="sf-mon-card__meta-icon" aria-hidden="true" />
              {{ t('bounded.environmental.monitorCards.personLabel') }}
            </dt>
            <dd class="sf-mon-card__meta-dd">{{ locField(c.personLoc) }}</dd>
          </div>
          <div class="sf-mon-card__meta-row">
            <dt class="sf-mon-card__meta-dt">
              <MapPin class="sf-mon-card__meta-icon" aria-hidden="true" />
              {{ t('bounded.environmental.monitorCards.destLabel') }}
            </dt>
            <dd class="sf-mon-card__meta-dd">{{ destinationLine(c) }}</dd>
          </div>
          <div class="sf-mon-card__meta-row">
            <dt class="sf-mon-card__meta-dt">
              <IdCard class="sf-mon-card__meta-icon" aria-hidden="true" />
              {{ t('bounded.environmental.monitorCards.roleLabel') }}
            </dt>
            <dd class="sf-mon-card__meta-dd">{{ roleLine(c) }}</dd>
          </div>
          <div class="sf-mon-card__meta-row">
            <dt class="sf-mon-card__meta-dt">
              <Warehouse class="sf-mon-card__meta-icon" aria-hidden="true" />
              {{ t('bounded.environmental.monitorCards.warehouseLabel') }}
            </dt>
            <dd class="sf-mon-card__meta-dd">{{ warehouseLine(c) }}</dd>
          </div>
        </dl>
      </div>

      <footer class="sf-mon-card__foot">
        <Thermometer class="sf-mon-card__foot-icon" aria-hidden="true" />
        <span class="sf-mon-card__foot-label">{{ t('bounded.environmental.monitorCards.rangeCaption') }}</span>
        <span class="sf-mon-card__foot-value">{{ formatRange(c) }}</span>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.sf-mon-grid {
  display: grid;
  gap: 12px;
  align-items: start;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 640px) {
  .sf-mon-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1100px) {
  .sf-mon-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.sf-mon-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-radius: 11px;
  border: 1px solid rgb(226 232 240 / 0.95);
  background: #ffffff;
  box-shadow:
    0 1px 2px rgb(15 23 42 / 0.04),
    0 6px 16px -10px rgb(15 23 42 / 0.08);
  color-scheme: light;
  font-family: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
  transition:
    box-shadow 0.22s ease,
    border-color 0.22s ease,
    transform 0.22s ease;
}

@media (hover: hover) and (pointer: fine) {
  .sf-mon-card:hover {
    transform: translateY(-2px);
    border-color: #e2e8f0;
  }
}

.sf-mon-card--safe {
  --sf-mon-line: #22c55e;
  --sf-mon-temp: #15803d;
}

.sf-mon-card--risk {
  --sf-mon-line: #ef4444;
  --sf-mon-temp: #b91c1c;
}

.sf-mon-card--paused {
  --sf-mon-line: #ea580c;
  --sf-mon-temp: #c2410c;
}

.sf-mon-card--safe,
.sf-mon-card--risk,
.sf-mon-card--paused {
  border-top: 3px solid var(--sf-mon-line);
  box-shadow:
    0 1px 2px rgb(15 23 42 / 0.04),
    0 6px 16px -10px rgb(15 23 42 / 0.08),
    inset 0 1px 0 rgb(255 255 255 / 0.7);
}

.sf-mon-card--risk {
  background: linear-gradient(180deg, #fef2f2 0%, #ffffff 48%);
  border-color: #fecaca;
}

@media (hover: hover) and (pointer: fine) {
  .sf-mon-card--safe:hover,
  .sf-mon-card--risk:hover,
  .sf-mon-card--paused:hover {
    box-shadow:
      0 4px 6px -2px rgb(15 23 42 / 0.06),
      0 16px 36px -16px rgb(15 23 42 / 0.18),
      inset 0 1px 0 rgb(255 255 255 / 0.75);
  }
}

.sf-mon-card__pill--obs {
  color: #b45309;
  background: linear-gradient(180deg, #fffbeb 0%, #fefce8 100%);
  border: 1px solid rgb(253 230 138 / 0.9);
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
}

.sf-mon-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 11px;
  background: #fff;
  border-bottom: 1px solid #eef2f6;
}

.sf-mon-card__title {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-family: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.02em;
  color: #1e293b;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.sf-mon-card__pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  max-width: 100%;
  padding: 4px 8px;
  border-radius: 9999px;
  font-family: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.055em;
  text-transform: uppercase;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
}

.sf-mon-card__pill-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.sf-mon-card__pill--safe {
  color: #166534;
  background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px solid rgb(187 247 208 / 0.85);
}

.sf-mon-card__pill--risk {
  color: #b91c1c;
  background: linear-gradient(180deg, #fff5f5 0%, #fef2f2 100%);
  border: 1px solid rgb(254 202 202 / 0.95);
}

.sf-mon-card__body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  padding: 7px 11px 8px;
  flex: 1 1 auto;
  min-height: 0;
  background: #fafbfc;
}

@media (min-width: 520px) {
  .sf-mon-card__body {
    grid-template-columns: minmax(76px, 96px) minmax(0, 1fr);
    column-gap: 10px;
    align-items: stretch;
  }
}

.sf-mon-card__readout-col {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-width: 0;
  width: 100%;
  padding: 6px 7px;
  border-radius: 7px;
  transition:
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.sf-mon-card--safe .sf-mon-card__readout-col {
  background: linear-gradient(165deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px solid rgb(34 197 94 / 0.12);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.65);
}

.sf-mon-card--risk .sf-mon-card__readout-col {
  background: linear-gradient(165deg, #fff1f2 0%, #fef2f2 100%);
  border: 1px solid rgb(239 68 68 / 0.14);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.75);
}

.sf-mon-card--paused .sf-mon-card__readout-col {
  background: linear-gradient(165deg, #fffbeb 0%, #fefce8 100%);
  border: 1px solid rgb(234 88 12 / 0.15);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.75);
}

.sf-mon-card__readout {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 2px 6px;
  width: 100%;
}

.sf-mon-card__meta {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  font-family: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  color: #64748b;
  flex: 1 1 auto;
  min-height: 0;
  background: #fff;
  border: 1px solid #eef2f6;
  border-radius: 7px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.035);
}

.sf-mon-card__meta-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr);
  gap: 2px 7px;
  align-items: center;
  padding: 6px 8px;
  margin: 0;
  border-radius: 0;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.14s ease;
}

.sf-mon-card__meta-row:last-child {
  border-bottom: none;
}

@media (hover: hover) and (pointer: fine) {
  .sf-mon-card__meta-row:hover {
    background: #f8fafc;
  }
}

.sf-mon-card__meta-dt {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: #94a3b8;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.045em;
  line-height: 1.2;
}

.sf-mon-card__meta-icon {
  width: 11px;
  height: 11px;
  flex-shrink: 0;
  color: #cbd5e1;
}

.sf-mon-card__meta-dd {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  line-height: 1.3;
  text-align: end;
  overflow-wrap: anywhere;
  word-break: break-word;
}

@media (max-width: 380px) {
  .sf-mon-card__meta-row {
    grid-template-columns: 1fr;
  }

  .sf-mon-card__meta-dd {
    text-align: start;
  }
}

.sf-mon-card__temp {
  font-family: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
  font-size: 26px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.038em;
  line-height: 1;
  color: var(--sf-mon-temp);
}

.sf-mon-card__unit {
  font-family: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  opacity: 0.92;
}

.sf-mon-card__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  margin-top: auto;
  padding: 6px 11px 7px;
  border-top: 1px solid #eef2f6;
  background: #fff;
  border-radius: 0 0 11px 11px;
  font-family: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
  font-size: 12px;
  color: #64748b;
}

.sf-mon-card__foot-icon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  color: #94a3b8;
  opacity: 0.88;
}

.sf-mon-card__foot-label {
  font-weight: 500;
  letter-spacing: 0.01em;
}

.sf-mon-card__foot-value {
  margin-left: auto;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #1e293b;
  letter-spacing: -0.02em;
}

@media (max-width: 380px) {
  .sf-mon-card__foot-value {
    margin-left: 0;
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sf-mon-card,
  .sf-mon-card__readout-col,
  .sf-mon-card__meta-row {
    transition: none;
  }

  .sf-mon-card:hover {
    transform: none;
  }
}
</style>
