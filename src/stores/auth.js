import { defineStore } from 'pinia'
import { api, setToken } from '@/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('kd_token') || '',
    usuario: JSON.parse(localStorage.getItem('kd_usuario') || 'null'),
    empresa: JSON.parse(localStorage.getItem('kd_empresa') || 'null')
  }),
  getters: {
    logado: (state) => !!state.token
  },
  actions: {
    async login(email, senha) {
      const res = await api.post('auth/login', { email, senha })
      this.token = res.token
      this.usuario = res.usuario
      this.empresa = res.empresa
      setToken(res.token)
      localStorage.setItem('kd_usuario', JSON.stringify(res.usuario))
      localStorage.setItem('kd_empresa', JSON.stringify(res.empresa))
    },
    logout() {
      this.token = ''
      this.usuario = null
      this.empresa = null
      setToken('')
      localStorage.removeItem('kd_usuario')
      localStorage.removeItem('kd_empresa')
    }
  }
})
