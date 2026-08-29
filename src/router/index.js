import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue'), meta: { auth: true } },
  { path: '/veiculos', name: 'veiculos', component: () => import('@/views/VeiculosView.vue'), meta: { auth: true } },
  { path: '/manutencao', name: 'manutencao', component: () => import('@/views/ManutencaoView.vue'), meta: { auth: true } },
  { path: '/requisicoes', name: 'requisicoes', component: () => import('@/views/RequisicoesView.vue'), meta: { auth: true } },
  { path: '/contas', name: 'contas', component: () => import('@/views/ContasView.vue'), meta: { auth: true } },
  { path: '/nfse', name: 'nfse', component: () => import('@/views/NfseView.vue'), meta: { auth: true } },
  { path: '/vistoria', name: 'vistoria', component: () => import('@/views/VistoriaView.vue'), meta: { auth: true } },
  { path: '/usuarios', name: 'usuarios', component: () => import('@/views/UsuariosView.vue'), meta: { auth: true } }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.auth && !auth.logado) return { name: 'login' }
  if (to.name === 'login' && auth.logado) return { name: 'home' }
  return true
})

export default router
