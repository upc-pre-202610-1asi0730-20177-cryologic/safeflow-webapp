import { defineStore } from 'pinia'
import { createAnalyticsDeliveryMix } from '../domain/model/analytics-delivery-mix.entity.js'
import { fetchAnalyticsDashboard } from '../infrastructure/analytics-api.js'
import { toAnalyticsKpiEntity } from '../infrastructure/analytics-kpi.assembler.js'
import { toAnalyticsDeliveryMixEntity } from '../infrastructure/analytics-delivery-mix.assembler.js'
import { toAnalyticsShipmentRowEntity } from '../infrastructure/analytics-shipment.assembler.js'
import { toAnalyticsFleetUnitEntity } from '../infrastructure/analytics-fleet.assembler.js'

const emptyMix = () =>
  createAnalyticsDeliveryMix({ deliveredPct: 0, transitPct: 0, pendingPct: 0, delayedPct: 0 })

export const useAnalyticsStore = defineStore('analytics', {
  state: () => ({
    kpis: [],
    deliveryMix: emptyMix(),
    recentShipments: [],
    fleet: [],
    chartWeek: [],
    chartMonth: [],
  }),
  actions: {
    async loadDashboard() {
      const raw = await fetchAnalyticsDashboard()
      this.kpis = raw.kpis.map(toAnalyticsKpiEntity)
      this.deliveryMix = toAnalyticsDeliveryMixEntity(raw.deliveryMix)
      this.recentShipments = raw.recentShipments.map(toAnalyticsShipmentRowEntity)
      this.fleet = raw.fleet.map(toAnalyticsFleetUnitEntity)
      this.chartWeek = raw.chartWeek ?? []
      this.chartMonth = raw.chartMonth ?? []
    },
  },
})
