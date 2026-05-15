import { createRouter, createWebHistory } from 'vue-router'
import { appHomePath, boundedContexts } from '@/shared/config/navigation.js'
import { isSessionAuthed } from '@/shared/config/session-auth.js'
import inventoryRoutes from '@/inventory/presentation/inventory-routes.js'
import { logisticsShellChildren } from '@/logistics/presentation/logistics-routes.js'
import Layout from '@/shared/presentation/components/layout.vue'

const AlertView = () => import('@/alerts/presentation/views/alert.vue')
const AnalyticsView = () => import('@/analytics/presentation/views/analytics.vue')
const MonitoringView = () => import('@/environmental-monitoring/presentation/views/monitoring.vue')
const InventoryView = () => import('@/inventory/presentation/views/InventoryView.vue')
const LogisticsShell = () => import('@/logistics/presentation/views/logistics-shell.vue')
const ReportingView = () => import('@/reporting/presentation/views/reporting.vue')
const ContextStub = () => import('@/shared/presentation/views/context-stub.vue')
const NotFoundView = () => import('@/shared/presentation/views/not-found.vue')
const ProfileView = () => import('@/shared/presentation/views/profile.vue')

const contextViewById = {
  analytics: AnalyticsView,
  'environmental-monitoring': MonitoringView,
  inventory: InventoryView,
  reporting: ReportingView,
}

/** @param {string} ctxId */
function contextRouteMeta(ctxId) {
  const ctx = boundedContexts.find((c) => c.id === ctxId)
  return { titleKey: ctx?.labelKey ?? 'shell.appName' }
}

const layoutChildren = [{ path: '', redirect: appHomePath }]

for (const ctx of boundedContexts) {
  if (ctx.id === 'logistics') {
    layoutChildren.push({
      path: 'logistics',
      component: LogisticsShell,
      children: logisticsShellChildren,
    })
    continue
  }
  const component =
    ctx.id === 'alerts' ? AlertView : contextViewById[ctx.id] ?? ContextStub
  const relPath = ctx.basePath.replace(/^\//, '')
  layoutChildren.push({
    path: relPath,
    name: `${ctx.id}-root`,
    component,
    meta: contextRouteMeta(ctx.id),
  })
}

layoutChildren.push({
  path: 'profile',
  name: 'profile',
  component: ProfileView,
  meta: { titleKey: 'shell.profilePage.title' },
})

const routes = [
  {
    path: '/',
    component: Layout,
    children: [...layoutChildren, ...inventoryRoutes],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.public) {
    if (isSessionAuthed() && (to.name === 'login' || to.name === 'register')) {
      return { name: 'analytics-root' }
    }
    return true
  }
  if (!isSessionAuthed()) {
    return { name: 'login', query: { next: to.fullPath } }
  }
  return true
})

export default router
