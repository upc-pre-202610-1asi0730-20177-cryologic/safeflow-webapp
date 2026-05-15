import { defineStore } from 'pinia'
import { fetchReportingDashboard } from '../infrastructure/reporting-api.js'
import { toReportingStatEntity } from '../infrastructure/reporting-stat.assembler.js'
import { toReportingCatalogItemEntity } from '../infrastructure/reporting-catalog.assembler.js'
import { toReportingRunEntity } from '../infrastructure/reporting-run.assembler.js'
import { buildPdfReportFromDb } from '../infrastructure/reporting-pdf-export.js'
import { downloadBlobAsFile } from '@/shared/infrastructure/download-blob.js'

export const useReportingStore = defineStore('reporting', {
  state: () => ({
    stats: [],
    catalog: [],
    recentRuns: [],
  }),
  actions: {
    async loadDashboard() {
      const raw = await fetchReportingDashboard()
      this.stats = raw.stats.map(toReportingStatEntity)
      this.catalog = raw.catalog.map(toReportingCatalogItemEntity)
      this.recentRuns = raw.recentRuns.map(toReportingRunEntity)
    },
    /**
     * @returns {{ ok: boolean, error?: string }}
     */
    generateReport(_catalogId) {
      try {
        const { filename, mime, blob } = buildPdfReportFromDb()
        const ok = downloadBlobAsFile(blob, filename)
        return ok ? { ok: true } : { ok: false }
      } catch (e) {
        console.error('[reporting] generateReport', e)
        return { ok: false, error: e instanceof Error ? e.message : String(e) }
      }
    },
  },
})
