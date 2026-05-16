import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDevInventoryApi } from './server/dev-inventory-api.mjs'
import { createDevLogisticsApi } from './server/dev-logistics-api.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbJsonPath = path.resolve(__dirname, 'server/db.json')

export default defineConfig({
  plugins: [
    {
      name: 'dev-inventory-db-api',
      enforce: 'pre',
      configureServer(server) {
        // Debe registrarse aquí (síncrono), no en el callback devuelto: ese se ejecuta
        // *después* de htmlFallbackMiddleware, que reescribe /api/* a /index.html cuando
        // Accept incluye */* (Axios lo envía), y la API de inventario nunca ve la ruta.
        server.middlewares.use(createDevInventoryApi(dbJsonPath))
        server.middlewares.use(createDevLogisticsApi(dbJsonPath))
      },
    },
    vue(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    warmup: {
      clientFiles: ['./src/main.js', './src/App.vue', './src/router.js'],
    },
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'vue-i18n',
      '@primeuix/themes/material',
      'primevue/config',
    ],
  },
  build: {
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/[/\\](primevue|@primevue|@primeuix)[/\\]/.test(id)) {
            return 'prime'
          }
          if (id.includes('lucide-vue-next')) {
            return 'lucide'
          }
        },
      },
    },
  },
})
