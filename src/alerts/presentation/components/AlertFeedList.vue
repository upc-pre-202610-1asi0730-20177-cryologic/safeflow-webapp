<script setup>
import { Thermometer, Clock, MapPin, User, Phone, Package } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useAlertsStore } from '../../application/alerts.store.js'
import { useEnvironmentalMonitoringStore } from '@/environmental-monitoring/application/monitoring.store.js'
import { isTemperatureOutOfRange } from '@/shared/domain/thermal-range.js'

defineProps({
  items: {
    type: Array,
    required: true,
  },
})

const { t, locale } = useI18n()
const alerts = useAlertsStore()
const monitoring = useEnvironmentalMonitoringStore()

function displayCurrentTemp(item) {
  const pid = item.idProducto
  if (!pid) return item.currentTemp
  const card = monitoring.monitorCards.find((c) => c.idProducto === pid)
  if (card != null && Number.isFinite(Number(card.currentTemp))) {
    return Number(card.currentTemp)
  }
  return item.currentTemp
}

function pickLocalized(msg) {
  if (!msg || typeof msg !== 'object') return ''
  const loc = locale.value === 'es' ? 'es' : 'en'
  return msg[loc] ?? msg.en ?? msg.es ?? ''
}

function formatRangePair(lo, hi) {
  const a = Number(lo)
  const b = Number(hi)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return ''
  return `${a.toFixed(1)} – ${b.toFixed(1)}°C`
}

function thermalProductLabel(item) {
  const card = item.idProducto ? monitoring.monitorCards.find((c) => c.idProducto === item.idProducto) : null
  const fromCard = card?.productNombre ? pickLocalized(card.productNombre) : ''
  if (fromCard) return fromCard
  const fromItem = item.productNombre ? pickLocalized(item.productNombre) : ''
  if (fromItem) return fromItem
  if (item.productTitleKey) return t(item.productTitleKey)
  return ''
}

function thermalRangeLabel(item) {
  const card = item.idProducto ? monitoring.monitorCards.find((c) => c.idProducto === item.idProducto) : null
  const lo = card != null ? card.rangeMin : item.rangeMin
  const hi = card != null ? card.rangeMax : item.rangeMax
  return formatRangePair(lo, hi)
}

function displayTitle(item) {
  const fromDb = pickLocalized(item.titleMessage)
  if (fromDb) return fromDb
  if (String(item.id || '').startsWith('thermal-')) {
    const product = thermalProductLabel(item)
    const range = thermalRangeLabel(item)
    if (product && range) return `${product} · ${range}`
    if (product) return product
  }
  if (item.productTitleKey) {
    return t(item.titleKey, { product: t(item.productTitleKey) })
  }
  return t(item.titleKey)
}

function displayWhere(item) {
  const loc = pickLocalized(item.contextLocation)
  if (loc) return loc
  return t(item.locationKey)
}

function displayContactName(item) {
  return pickLocalized(item.contactName)
}

function hasContactBlock(item) {
  const name = displayContactName(item)
  const detail = item.contactDetail != null ? String(item.contactDetail).trim() : ''
  return !!(name || detail)
}

function contactHref(detail) {
  if (!detail) return ''
  const d = String(detail).trim()
  if (d.includes('@')) return `mailto:${d}`
  const normalized = d.replace(/\s/g, '')
  if (/^\+?[\d-]{6,}$/.test(normalized)) return `tel:${normalized}`
  return ''
}

function displayTime(item) {
  if (item.timeIso) {
    const d = new Date(item.timeIso)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString(locale.value === 'es' ? 'es' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    }
  }
  return t(item.timeKey)
}

function formatTemp(n) {
  return `${Number(n).toFixed(1)}°C`
}

function thermalRangeForItem(item) {
  const card = item.idProducto ? monitoring.monitorCards.find((c) => c.idProducto === item.idProducto) : null
  return {
    lo: card != null ? card.rangeMin : item.rangeMin,
    hi: card != null ? card.rangeMax : item.rangeMax,
  }
}

/** Cualquier lectura fuera de rango → tarjeta roja (arriba o abajo del límite). */
function itemOutOfRange(item) {
  const { lo, hi } = thermalRangeForItem(item)
  return isTemperatureOutOfRange(displayCurrentTemp(item), lo, hi)
}

function cardClass(item) {
  return itemOutOfRange(item) ? 'sf-alert-card--high' : 'sf-alert-card--high'
}

function iconWrapClass(item) {
  return itemOutOfRange(item) ? 'sf-alert-card__icon-wrap--high' : 'sf-alert-card__icon-wrap--high'
}

function tempValueClass(item) {
  return itemOutOfRange(item) ? 'sf-alert-card__temp-val--high' : 'sf-alert-card__temp-val--high'
}

function isUnderObservation(item) {
  return monitoring.isThermalPausedAlert(item.id)
}
</script>

<template>
  <div class="sf-alert-feed sf-alert-feed--light">
    <p v-if="items.length === 0" class="sf-alert-feed__empty">{{ t('bounded.alerts.emptyFeed') }}</p>
    <article
      v-for="item in items"
      :key="item.id"
      class="sf-alert-card"
      :class="[cardClass(item), { 'sf-alert-card--observing': isUnderObservation(item) }]"
    >
      <div class="sf-alert-card__inner">
        <p v-if="isUnderObservation(item)" class="sf-alert-card__obs-banner" role="status">
          {{ t('bounded.alerts.observationBanner') }}
        </p>
        <div class="sf-alert-card__row">
          <div class="sf-alert-card__main">
            <div class="sf-alert-card__icon-wrap" :class="iconWrapClass(item)">
              <Thermometer class="sf-alert-card__therm" aria-hidden="true" />
            </div>
            <div class="sf-alert-card__body">
              <h3 class="sf-alert-card__title">{{ displayTitle(item) }}</h3>
              <p v-if="item.idDespacho" class="sf-alert-card__meta sf-alert-card__meta--dispatch">
                <Package class="sf-alert-card__meta-icon" aria-hidden="true" />
                <span>{{ t('bounded.alerts.card.dispatchId', { id: item.idDespacho }) }}</span>
              </p>
              <p class="sf-alert-card__meta">
                <MapPin class="sf-alert-card__meta-icon" aria-hidden="true" />
                <span
                  ><span class="sf-alert-card__k">{{ t('bounded.alerts.card.where') }}</span>
                  {{ displayWhere(item) }}</span
                >
              </p>
              <div v-if="hasContactBlock(item)" class="sf-alert-card__contact">
                <p v-if="displayContactName(item)" class="sf-alert-card__meta">
                  <User class="sf-alert-card__meta-icon" aria-hidden="true" />
                  <span
                    ><span class="sf-alert-card__k">{{ t('bounded.alerts.card.personInCharge') }}</span>
                    {{ displayContactName(item) }}</span
                  >
                </p>
                <p v-if="item.contactDetail && String(item.contactDetail).trim()" class="sf-alert-card__meta">
                  <Phone class="sf-alert-card__meta-icon" aria-hidden="true" />
                  <span
                    ><span class="sf-alert-card__k">{{ t('bounded.alerts.card.contact') }}</span>
                    <a
                      v-if="contactHref(item.contactDetail)"
                      class="sf-alert-card__link"
                      :href="contactHref(item.contactDetail)"
                      >{{ String(item.contactDetail).trim() }}</a
                    >
                    <template v-else>{{ String(item.contactDetail).trim() }}</template></span
                  >
                </p>
              </div>
              <p class="sf-alert-card__meta sf-alert-card__meta--time">
                <Clock class="sf-alert-card__meta-icon" aria-hidden="true" />
                <span>{{ displayTime(item) }}</span>
              </p>
              <p class="sf-alert-card__status">
                <span>{{ t('bounded.alerts.card.tempIntro') }}</span>
                <strong class="sf-alert-card__temp-strong" :class="tempValueClass(item)">{{
                  formatTemp(displayCurrentTemp(item))
                }}</strong>
              </p>
            </div>
          </div>
          <div class="sf-alert-card__actions">
            <pv-button
              outlined
              severity="warn"
              icon="pi pi-eye"
              :label="t('bounded.alerts.observe')"
              class="sf-alert-card__btn sf-alert-card__btn--observe"
              :disabled="isUnderObservation(item)"
              :title="
                isUnderObservation(item) ? t('bounded.alerts.observeDisabledHint') : undefined
              "
              @click="alerts.markThermalObservation(item.id)"
            />
            <pv-button
              outlined
              severity="success"
              icon="pi pi-check"
              :label="t('bounded.alerts.solved')"
              class="sf-alert-card__btn sf-alert-card__btn--solve"
              @click="alerts.markThermalSolved(item.id)"
            />
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.sf-alert-feed {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sf-alert-feed--light {
  color-scheme: light;
  font-family: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
}

.sf-alert-feed__empty {
  margin: 0;
  padding: 16px 18px;
  font-size: 15px;
  color: #64748b;
  line-height: 1.5;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
}

.sf-alert-card {
  --sf-alert-line: #94a3b8;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.sf-alert-card--high {
  --sf-alert-line: #dc2626;
  background: #fef2f2;
  border-color: #fecaca;
}

.sf-alert-card--high {
  box-shadow:
    inset 0 3px 0 0 var(--sf-alert-line),
    0 1px 2px rgba(15, 23, 42, 0.05);
}

.sf-alert-card__inner {
  padding: 0;
}

.sf-alert-card__obs-banner {
  margin: 0;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
  background: #fffbeb;
  border-bottom: 1px solid #fde68a;
  line-height: 1.35;
}

.sf-alert-card--observing.sf-alert-card--high {
  box-shadow:
    inset 0 3px 0 0 #f59e0b,
    0 1px 2px rgba(15, 23, 42, 0.05);
}

.sf-alert-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px 18px;
}

.sf-alert-card__main {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
  flex: 1;
}

.sf-alert-card__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  flex-shrink: 0;
  border: 1px solid rgb(15 23 42 / 0.08);
}

.sf-alert-card__icon-wrap--high {
  background: #fef2f2;
  color: #b91c1c;
}

.sf-alert-card__icon-wrap--low {
  background: #eff6ff;
  color: #1d4ed8;
}

.sf-alert-card__therm {
  width: 23px;
  height: 23px;
}

.sf-alert-card__body {
  min-width: 0;
}

.sf-alert-card__title {
  margin: 0 0 8px;
  font-size: clamp(17px, 1.4vw, 19px);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--sf-ui-text);
  line-height: 1.3;
}

.sf-alert-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 4px;
  font-size: 14px;
  color: #64748b;
}

.sf-alert-card__meta--time {
  margin-bottom: 8px;
}

.sf-alert-card__meta--dispatch {
  margin-bottom: 2px;
}

.sf-alert-card__k {
  font-weight: 600;
  color: #475569;
  margin-right: 4px;
}

.sf-alert-card__contact {
  margin: 4px 0 2px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.sf-alert-card__contact .sf-alert-card__meta {
  margin-bottom: 2px;
}

.sf-alert-card__contact .sf-alert-card__meta:last-child {
  margin-bottom: 0;
}

.sf-alert-card__link {
  color: #1d4ed8;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.sf-alert-card__link:hover {
  color: #1e40af;
}

.sf-alert-card__meta-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #94a3b8;
}

.sf-alert-card__status {
  margin: 0;
  font-size: 16px;
  color: #475569;
  line-height: 1.5;
}

.sf-alert-card__temp-strong {
  font-weight: 700;
  font-size: 1.0625em;
}

.sf-alert-card__temp-val--high {
  color: #dc2626;
}

.sf-alert-card__temp-val--low {
  color: #2563eb;
}

.sf-alert-card__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
  min-width: 160px;
}

.sf-alert-card__btn {
  width: 100%;
}

.sf-alert-card__btn:deep(.p-button) {
  width: 100%;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-radius: 12px !important;
  padding-block: 9px !important;
  padding-inline: 14px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 1.25;
  border-width: 1.5px !important;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.1s ease;
}

.sf-alert-card__btn:deep(.p-button-icon) {
  font-size: 15px;
  margin-inline-end: 0 !important;
}

.sf-alert-card__btn:deep(.p-button-label) {
  font-weight: 600;
  flex: 0 1 auto;
}

@media (hover: hover) and (pointer: fine) {
  .sf-alert-card__btn--observe:deep(.p-button:not(:disabled):hover) {
    background: rgba(245, 158, 11, 0.12) !important;
    box-shadow: 0 1px 3px rgba(180, 83, 9, 0.12);
  }

  .sf-alert-card__btn--solve:deep(.p-button:not(:disabled):hover) {
    background: rgba(34, 197, 94, 0.1) !important;
    box-shadow: 0 1px 3px rgba(22, 163, 74, 0.12);
  }

  .sf-alert-card__btn:deep(.p-button:not(:disabled):active) {
    transform: scale(0.985);
  }
}

.sf-alert-card__btn--observe:deep(.p-button:disabled) {
  opacity: 0.52;
  cursor: not-allowed;
}

.sf-alert-card__btn--observe:deep(.p-button:focus-visible),
.sf-alert-card__btn--solve:deep(.p-button:focus-visible) {
  outline: none;
}

.sf-alert-card__btn--observe:deep(.p-button:focus-visible) {
  box-shadow:
    0 0 0 2px #fff,
    0 0 0 4px rgba(245, 158, 11, 0.45) !important;
}

.sf-alert-card__btn--solve:deep(.p-button:focus-visible) {
  box-shadow:
    0 0 0 2px #fff,
    0 0 0 4px rgba(34, 197, 94, 0.4) !important;
}
</style>
