<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useReportingStore } from '../../application/reporting.store.js'
import ReportingStatsRow from '../components/ReportingStatsRow.vue'
import ReportingCatalogGrid from '../components/ReportingCatalogGrid.vue'
import ReportingRecentRunsTable from '../components/ReportingRecentRunsTable.vue'

const reporting = useReportingStore()
const { stats, catalog, recentRuns } = storeToRefs(reporting)

onMounted(() => {
  reporting.loadDashboard()
})
</script>

<template>
  <div class="sf-rep-page">
    <ReportingStatsRow :items="stats" />

    <ReportingCatalogGrid :items="catalog" />

    <ReportingRecentRunsTable :rows="recentRuns" />
  </div>
</template>

<style scoped>
.sf-rep-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 100%;
}
</style>
