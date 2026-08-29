<template>
  <div id="app" class="min-h-screen bg-slate-50">
    <header v-if="auth.logado" class="bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      <router-link to="/" class="font-semibold tracking-tight">{{ auth.empresa?.nome || 'KD Locações' }}</router-link>
      <div class="flex items-center gap-3 text-sm">
        <span class="text-slate-300 hidden sm:inline">{{ auth.usuario?.nome }}</span>
        <button @click="sair" class="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md transition">Sair</button>
      </div>
    </header>
    <router-view />
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function sair() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
