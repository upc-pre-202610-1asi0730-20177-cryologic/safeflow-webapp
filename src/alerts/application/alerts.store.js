import { defineStore } from 'pinia'
import { fetchAlertsDashboard } from '../infrastructure/alerts-api.js'
import { toAlertKpiEntity } from '../infrastructure/alert-kpi.assembler.js'
import { toAlertFeedItemEntity } from '../infrastructure/alert-feed-item.assembler.js'
import { thermalAlertDtosFromMonitorCards } from '../infrastructure/thermal-alert-feed.assembler.js'
import { useEnvironmentalMonitoringStore } from '@/environmental-monitoring/application/monitoring.store.js'
import { parseThermalAlertInstanceId, buildThermalAlertInstanceId } from '@/environmental-monitoring/domain/thermal-alert-instance-id.js'

export const useAlertsStore = defineStore('alerts', {
  state: () => ({
    kpis: [],
    feedItems: [],
    /** Productos con alerta térmica ocultas por el usuario hasta que vuelvan a rango seguro. */
    dismissedThermalProductIds: [],
  }),
  actions: {
    async loadDashboard() {
      const monitoring = useEnvironmentalMonitoringStore()
      if (!monitoring.monitorCards.length) {
        await monitoring.loadDashboard({ force: true })
      }
      const raw = await fetchAlertsDashboard()
      this.kpis = raw.kpis.map(toAlertKpiEntity)
      this.rebuildThermalFeed()
    },
    rebuildThermalFeed() {
      const monitoring = useEnvironmentalMonitoringStore()
      const cards = monitoring.monitorCards ?? []

      for (const c of cards) {
        if (c.status === 'safe' && c.idProducto) {
          this.dismissedThermalProductIds = this.dismissedThermalProductIds.filter((id) => id !== c.idProducto)
        }
      }

      const paused = monitoring.thermalPausedAlertIds ?? []
      const dtos = thermalAlertDtosFromMonitorCards(cards).filter(
        (d) => !this.dismissedThermalProductIds.includes(d.idProducto),
      )
      this.feedItems = dtos.map(toAlertFeedItemEntity)

      const totalPoints = cards.length
      const openVisible = dtos.length
      const atRisk = cards.filter((c) => {
        if (c.status !== 'warning') return false
        const aid = buildThermalAlertInstanceId(c)
        return aid == null || !paused.includes(aid)
      }).length

      this.kpis = this.kpis.map((k) => {
        if (k.id === 'shipments') {
          return { ...k, value: totalPoints }
        }
        if (k.id === 'transit') {
          return {
            ...k,
            value: openVisible,
            trendTone: openVisible > 0 ? 'negative' : 'positive',
            trendUp: openVisible > 0,
          }
        }
        if (k.id === 'delayed') {
          return {
            ...k,
            value: atRisk,
            trendTone: atRisk > 0 ? 'negative' : 'positive',
            trendUp: atRisk > 0,
          }
        }
        return k
      })
    },
    thermalProductIdFromAlertId(id) {
      return parseThermalAlertInstanceId(id).idProducto
    },
    /** Pausa la actualización de la lectura térmica; la tarjeta de alerta sigue visible con contacto. */
    markThermalObservation(id) {
      if (!id || !String(id).startsWith('thermal-')) return
      const monitoring = useEnvironmentalMonitoringStore()
      monitoring.pauseThermalForAlert(String(id))
      this.rebuildThermalFeed()
    },
    /** Reanuda la temperatura y deja la lectura en rango seguro (demo). */
    markThermalSolved(id) {
      const idProducto = this.thermalProductIdFromAlertId(id)
      if (!idProducto) return
      const monitoring = useEnvironmentalMonitoringStore()
      monitoring.resumeThermalForAlert(String(id), { stabilize: true })
      this.dismissedThermalProductIds = this.dismissedThermalProductIds.filter((x) => x !== idProducto)
      this.rebuildThermalFeed()
    },
    resolveAlert(id) {
      this.markThermalSolved(id)
    },
  },
})
