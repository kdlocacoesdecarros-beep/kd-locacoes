<template>
  <div class="max-w-md mx-auto px-4 py-6">
    <router-link to="/" class="text-slate-500 text-sm">← Voltar</router-link>
    <h1 class="text-lg font-semibold text-slate-900 mt-2 mb-1">Minha conta</h1>
    <p class="text-sm text-slate-500 mb-6">{{ auth.usuario?.nome }} · {{ auth.usuario?.email }}</p>

    <form @submit.prevent="trocar" class="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h2 class="font-medium text-slate-800 text-sm mb-1">Alterar senha</h2>
      <input v-model="senhaAtual" type="password" placeholder="Senha atual" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <input v-model="novaSenha" type="password" placeholder="Nova senha (mín. 6 caracteres)" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <input v-model="confirmar" type="password" placeholder="Confirmar nova senha" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <p v-if="erro" class="text-red-600 text-sm">{{ erro }}</p>
      <p v-if="sucesso" class="text-green-600 text-sm">Senha alterada com sucesso.</p>
      <button type="submit" :disabled="carregando" class="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm w-full">
        {{ carregando ? 'Salvando...' : 'Salvar nova senha' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const senhaAtual = ref('')
const novaSenha = ref('')
const confirmar = ref('')
const erro = ref('')
const sucesso = ref(false)
const carregando = ref(false)

async function trocar() {
  erro.value = ''
  sucesso.value = false
  if (novaSenha.value !== confirmar.value) { erro.value = 'As senhas não coincidem.'; return }
  carregando.value = true
  try {
    await api.post('auth/alterar-senha', { senhaAtual: senhaAtual.value, novaSenha: novaSenha.value })
    sucesso.value = true
    senhaAtual.value = ''; novaSenha.value = ''; confirmar.value = ''
  } catch (e) {
    erro.value = e.message
  } finally {
    carregando.value = false
  }
}
</script>
