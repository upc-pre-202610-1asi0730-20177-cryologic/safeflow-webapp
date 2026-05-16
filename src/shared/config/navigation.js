import {
  BarChart3,
  Bell,
  FileBarChart,
  Leaf,
  Package,
  Truck,
} from 'lucide-vue-next'

/**
 * Pantalla al abrir `/` o al pulsar la marca SafeFlow en el sidebar.
 */
export const appHomePath = '/analytics'

/**
 * Solo entrada principal por módulo (sin subrutas ni submenú lateral).
 */
export const boundedContexts = [
  {
    id: 'analytics',
    labelKey: 'bounded.analytics.label',
    basePath: '/analytics',
    icon: BarChart3,
  },
  {
    id: 'inventory',
    labelKey: 'bounded.inventory.label',
    basePath: '/inventory',
    icon: Package,
  },
  {
    id: 'logistics',
    labelKey: 'bounded.logistics.label',
    basePath: '/logistics',
    icon: Truck,
  },
  {
    id: 'environmental-monitoring',
    labelKey: 'bounded.environmental.label',
    basePath: '/environmental-monitoring',
    icon: Leaf,
  },
  {
    id: 'alerts',
    labelKey: 'bounded.alerts.label',
    basePath: '/alerts',
    icon: Bell,
  },
  {
    id: 'reporting',
    labelKey: 'bounded.reporting.label',
    basePath: '/reporting',
    icon: FileBarChart,
  },
]

export function contextByPath(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return boundedContexts.find((c) => normalized === c.basePath)
}
