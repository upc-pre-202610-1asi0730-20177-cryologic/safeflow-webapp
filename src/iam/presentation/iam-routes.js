const LoginView = () => import('@/iam/presentation/views/login.vue')
const RegisterView = () => import('@/iam/presentation/views/register.vue')

/** Rutas públicas IAM: fuera del `Layout` con sidebar. */
export default [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { public: true },
  },
]
