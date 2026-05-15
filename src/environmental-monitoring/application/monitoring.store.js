import { defineStore } from 'pinia'
import { fetchMonitoringDashboard } from '../infrastructure/monitoring-api.js'
import { toMonitoringKpiEntity } from '../infrastructure/monitoring-kpi.assembler.js'
import { toMonitoringCardEntity } from '../infrastructure/monitoring-card.assembler.js'
import {
  buildThermalAlertInstanceId,
  parseThermalAlertInstanceId,
} from '../domain/thermal-alert-instance-id.js'
import { thermalStatusFromReading } from '../../shared/domain/thermal-range.js'

const SIMULATION_INTERVAL_MS = 2800

export const useEnvironmentalMonitoringStore = defineStore('environmentalMonitoring', {
  state: () => ({
    kpis: [],
    monitorCards: [],
    simulationActive: false,
    /** Ids de alerta térmica (`thermal-{producto}__{idTarjeta}`): pausa solo esa tarjeta, no todo el producto. */
    thermalPausedAlertIds: [],
    /** @type {ReturnType<typeof setInterval> | null} */
    _simulationTimer: null,
  }),
  actions: {
    /**
     * @param {{ force?: boolean }} [opts]
     * Con `force: true` siempre sustituye datos desde `db.json`.
     * Sin forzar, no pisa tarjetas mientras la simulación está activa (misma lectura en logística y monitoreo).
     */
    async loadDashboard(opts = {}) {
      const force = opts.force === true
      if (!force && this.simulationActive && this.monitorCards.length > 0) {
        return
      }
      const raw = await fetchMonitoringDashboard()
      this.kpis = raw.kpis.map(toMonitoringKpiEntity)
      this.monitorCards = raw.monitorCards.map((dto) => {
        const e = toMonitoringCardEntity(dto)
        return { ...e }
      })
    },
    addMonitoringPoint() {
      /* Alta de punto de monitoreo */
    },
    isThermalPausedAlert(alertId) {
      return alertId != null && String(alertId).length > 0 && this.thermalPausedAlertIds.includes(String(alertId))
    },
    isThermalPausedForMonitorCard(card) {
      const aid = buildThermalAlertInstanceId(card)
      return aid != null && this.thermalPausedAlertIds.includes(aid)
    },
    pauseThermalForAlert(alertId) {
      const id = alertId != null ? String(alertId) : ''
      if (!id || this.thermalPausedAlertIds.includes(id)) return
      this.thermalPausedAlertIds = [...this.thermalPausedAlertIds, id]
    },
    /**
     * Reanuda la simulación/actualización de temperatura para **esa** tarjeta/alerta.
     * @param {{ stabilize?: boolean }} [opts] — si `stabilize`, fija lectura al centro del rango y estado seguro en esa fila.
     */
    resumeThermalForAlert(alertId, opts = {}) {
      const id = alertId != null ? String(alertId) : ''
      if (!id) return
      this.thermalPausedAlertIds = this.thermalPausedAlertIds.filter((x) => x !== id)
      if (opts.stabilize === true) {
        const { monitorCardKey } = parseThermalAlertInstanceId(id)
        this.monitorCards = this.monitorCards.map((card) => {
          if (!monitorCardKey || String(card.id) !== monitorCardKey) return card
          const lo = Number(card.rangeMin)
          const hi = Number(card.rangeMax)
          const mid = Math.round(((lo + hi) / 2) * 10) / 10
          return { ...card, currentTemp: mid, status: 'safe' }
        })
      }
    },
    async toggleTemperatureSimulation() {
      if (this.simulationActive) {
        this.stopTemperatureSimulation()
        return
      }
      if (!this.monitorCards.length) {
        await this.loadDashboard()
      }
      this.startTemperatureSimulation()
    },
    startTemperatureSimulation() {
      if (typeof window === 'undefined') return
      if (this._simulationTimer != null) return
      if (!this.monitorCards.length) return
      this.simulationActive = true
      const tick = () => {
        this.monitorCards = this.monitorCards.map((card) => {
          const aid = buildThermalAlertInstanceId(card)
          if (aid != null && this.thermalPausedAlertIds.includes(aid)) {
            return card
          }
          const lo = Number(card.rangeMin)
          const hi = Number(card.rangeMax)
          const mid = (lo + hi) / 2
          const spread = Math.max(hi - lo, 0.5)
          const wobble = (Math.random() - 0.48) * (spread * 0.35)
          const spike =
            Math.random() < 0.14
              ? (Math.random() < 0.5 ? hi - card.currentTemp + spread * 0.25 : lo - card.currentTemp - spread * 0.25)
              : 0
          let currentTemp = Number(card.currentTemp) + wobble + spike * 0.35
          if (Math.random() < 0.06) {
            currentTemp = mid + (Math.random() - 0.5) * spread * 1.15
          }
          currentTemp = Math.round(currentTemp * 10) / 10
          return {
            ...card,
            currentTemp,
            status: thermalStatusFromReading(currentTemp, lo, hi),
          }
        })
      }
      tick()
      this._simulationTimer = window.setInterval(tick, SIMULATION_INTERVAL_MS)
    },
    stopTemperatureSimulation() {
      if (typeof window === 'undefined') return
      if (this._simulationTimer != null) {
        window.clearInterval(this._simulationTimer)
        this._simulationTimer = null
      }
      this.simulationActive = false
    },
    /**
     * Vuelve a leer `db.json` vía API (inventario + logística) y actualiza KPIs y tarjetas.
     * Si la simulación térmica estaba activa, se reinicia para incluir filas nuevas sin dejar timers huérfanos.
     */
    async resyncFromServer() {
      const wasSim = this.simulationActive
      if (wasSim) this.stopTemperatureSimulation()
      await this.loadDashboard({ force: true })
      if (wasSim) this.startTemperatureSimulation()
    },
  },
})
