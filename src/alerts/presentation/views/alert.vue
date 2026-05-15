<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAlertsStore } from '../../application/alerts.store.js'
import ColdChainKpiGrid from '@/shared/presentation/components/cold-chain/ColdChainKpiGrid.vue'
import AlertFeedList from '../components/AlertFeedList.vue'

const alerts = useAlertsStore()
const { kpis, feedItems } = storeToRefs(alerts)

onMounted(() => {
  void alerts.loadDashboard()
})
</script>

<template>
  <div class="sf-alerts-page">
    <ColdChainKpiGrid :items="kpis" />

    <AlertFeedList :items="feedItems" />
  </div>
</template>

<style scoped>
.sf-alerts-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 100%;
}

</style>
