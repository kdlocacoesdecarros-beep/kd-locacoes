<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <form @submit.prevent="entrar" class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-sm">
      <h1 class="text-xl font-semibold text-slate-900 mb-1">KD Locações</h1>
      <p class="text-slate-500 text-sm mb-6">Entre com seu e-mail e senha</p>

      <label class="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
      <input v-model="email" type="email" required
        class="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-slate-900" />

      <label class="block text-sm font-medium text-slate-700 mb-1">Senha</label>
      <input v-model="senha" type="password" required
        class="w-full border border-slate-300 rounded-lg px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-slate-900" />

      <p v-if="erro" class="text-red-600 text-sm mb-4">{{ erro }}</p>

      <button type="submit" :disabled="carregando"
        class="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 transition">
        {{ carregando ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const senha = ref('')
const erro = ref('')
const carregando = ref(false)
const auth = useAuthStore()
const router = useRouter()

async function entrar() {
  erro.value = ''
  carregando.value = true
  try {
    await auth.login(email.value, senha.value)
    router.push({ name: 'home' })
  } catch (e) {
    erro.value = e.message
  } finally {
    carregando.value = false
  }
}
</script>
