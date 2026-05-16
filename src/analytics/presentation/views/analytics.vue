<script setup>
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAnalyticsStore } from '../../application/analytics.store.js'
import ColdChainKpiGrid from '@/shared/presentation/components/cold-chain/ColdChainKpiGrid.vue'
import AnalyticsWeeklyChartCard from '../components/AnalyticsWeeklyChartCard.vue'
import AnalyticsDeliveryStatusCard from '../components/AnalyticsDeliveryStatusCard.vue'
import AnalyticsRecentShipmentsTable from '../components/AnalyticsRecentShipmentsTable.vue'
import AnalyticsFleetPanel from '../components/AnalyticsFleetPanel.vue'

const analytics = useAnalyticsStore()
const route = useRoute()
const { kpis, deliveryMix, recentShipments, fleet, chartWeek, chartMonth } = storeToRefs(analytics)

function refreshDashboard() {
  void analytics.loadDashboard()
}

onMounted(refreshDashboard)

watch(
  () => route.path,
  (path, prev) => {
    if (path !== prev && path.startsWith('/analytics')) refreshDashboard()
  },
)
</script>

<template>
  <div class="sf-analytics-page">
    <ColdChainKpiGrid :items="kpis" />

    <div class="sf-analytics-page-row sf-analytics-page-row-middle">
      <AnalyticsWeeklyChartCard
        class="sf-analytics-page-wide"
        :week-series="chartWeek"
        :month-series="chartMonth"
      />
      <AnalyticsDeliveryStatusCard class="sf-analytics-page-side" :mix="deliveryMix" />
    </div>

    <div class="sf-analytics-page-row sf-analytics-page-row-bottom">
      <AnalyticsRecentShipmentsTable class="sf-analytics-page-wide" :rows="recentShipments" />
      <AnalyticsFleetPanel class="sf-analytics-page-side" :items="fleet" />
    </div>
  </div>
</template>

<style scoped>
.sf-analytics-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 100%;
}

.sf-analytics-page-row {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

@media (min-width: 960px) {
  .sf-analytics-page-row-middle,
  .sf-analytics-page-row-bottom {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  }

  .sf-analytics-page-wide {
    min-width: 0;
  }

  .sf-analytics-page-side {
    min-width: 0;
  }
}
</style>
