/**
 * Rutas del contexto Inventory (análogo a publishing-routes.js en learning-center).
 * Rutas de primer nivel; el listado principal sigue en router.js junto al resto de módulos.
 */
const inventoryNewProduct = () => import('./views/InventoryNewProduct.vue')
const inventoryAddStockLine = () => import('./views/InventoryAddStockLine.vue')

export default [
  {
    path: 'inventory/new',
    redirect: '/inventory/add',
  },
  {
    path: 'inventory/add',
    name: 'inventory-add-product',
    component: inventoryNewProduct,
    meta: { titleKey: 'bounded.inventory.label' },
  },
  {
    path: 'inventory/stock-line',
    name: 'inventory-add-stock-line',
    component: inventoryAddStockLine,
    meta: { titleKey: 'bounded.inventory.label' },
  },
]
