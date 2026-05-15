/**
 * Rutas públicas IAM (misma convención que iam-routes.js en learning-center).
 */
const login = () => import('./views/login.vue')
const register = () => import('./views/register.vue')

export default [
  {
    path: '/login',
    name: 'login',
    component: login,
    meta: { public: true },
  },
  {
    path: '/register',
    name: 'register',
    component: register,
    meta: { public: true },
  },
]
