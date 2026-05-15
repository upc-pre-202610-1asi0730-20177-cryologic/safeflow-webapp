/**
 * Rutas hijas de /logistics (listado, formularios). El padre es `logistics-shell.vue` en `router.js`.
 */
const LogisticPage = () => import('./views/logistic.vue')
const logisticsNewShipment = () => import('./views/logistics-new-shipment.vue')
const logisticsNewDestination = () => import('./views/logistics-new-destination.vue')
const logisticsNewDriver = () => import('./views/logistics-new-driver.vue')

export const logisticsShellChildren = [
    {
        path: '',
        name: 'logistics-root',
        component: LogisticPage,
        meta: { titleKey: 'bounded.logistics.label' },
    },
    {
        path: 'new',
        redirect: '/logistics/add',
    },
    {
        path: 'add',
        name: 'logistics-add-shipment',
        component: logisticsNewShipment,
        meta: { titleKey: 'bounded.logistics.label' },
    },
    {
        path: 'destinations/new',
        redirect: '/logistics/destinations/add',
    },
    {
        path: 'destinations/add',
        name: 'logistics-add-destination',
        component: logisticsNewDestination,
        meta: { titleKey: 'bounded.logistics.label' },
    },
    {
        path: 'drivers/new',
        redirect: '/logistics/drivers/add',
    },
    {
        path: 'drivers/add',
        name: 'logistics-add-driver',
        component: logisticsNewDriver,
        meta: { titleKey: 'bounded.logistics.label' },
    },
]
