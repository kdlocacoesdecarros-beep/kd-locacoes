<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4">
      <router-link to="/" class="text-slate-500 text-sm">← Voltar</router-link>
      <h1 class="text-lg font-semibold text-slate-900">Usuários</h1>
      <button @click="mostrarForm = !mostrarForm" class="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg">
        {{ mostrarForm ? 'Cancelar' : '+ Novo' }}
      </button>
    </div>

    <form v-if="mostrarForm" @submit.prevent="cadastrar" class="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
      <input v-model="novo.nome" placeholder="Nome completo" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <input v-model="novo.email" type="email" placeholder="E-mail" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <input v-model="novo.senha" type="password" placeholder="Senha inicial (mín. 6 caracteres)" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <select v-model="novo.perfil" class="w-full border border-slate-300 rounded-lg px-3 py-2">
        <option value="motorista">Motorista</option>
        <option value="gestor">Gestor</option>
        <option value="admin">Administrador</option>
      </select>
      <p v-if="erro" class="text-red-600 text-sm">{{ erro }}</p>
      <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm">Cadastrar</button>
    </form>

    <p v-if="carregando" class="text-slate-500 text-sm">Carregando...</p>
    <div v-else class="space-y-2">
      <div v-for="u in usuarios" :key="u.id" class="bg-white border border-slate-200 rounded-xl p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-slate-900">{{ u.nome }}</p>
            <p class="text-sm text-slate-500">{{ u.email }} · {{ u.perfil }}</p>
          </div>
          <div class="flex items-center gap-2">
            <span :class="u.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'" class="text-xs px-2 py-1 rounded-full">
              {{ u.ativo ? 'Ativo' : 'Inativo' }}
            </span>
            <button @click="redefinirAberto = redefinirAberto === u.id ? null : u.id" class="text-xs text-indigo-600 underline">
              Redefinir senha
            </button>
          </div>
        </div>

        <form v-if="redefinirAberto === u.id" @submit.prevent="redefinirSenha(u.id)" class="mt-3 border-t border-slate-100 pt-3 flex gap-2">
          <input v-model="novaSenha" type="password" placeholder="Nova senha (mín. 4 caracteres)" required class="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm">Salvar</button>
        </form>
        <p v-if="redefinirAberto === u.id && msgRedefinir" class="text-sm mt-2" :class="msgRedefinirErro ? 'text-red-600' : 'text-green-600'">{{ msgRedefinir }}</p>
      </div>
      <p v-if="!usuarios.length" class="text-slate-400 text-sm text-center py-8">Nenhum usuário cadastrado.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'

const usuarios = ref([])
const carregando = ref(true)
const mostrarForm = ref(false)
const erro = ref('')
const novo = reactive({ nome: '', email: '', senha: '', perfil: 'motorista' })
const auth = useAuthStore()

const redefinirAberto = ref(null)
const novaSenha = ref('')
const msgRedefinir = ref('')
const msgRedefinirErro = ref(false)

async function carregar() {
  carregando.value = true
  try {
    const res = await api.get('auth/usuarios-listar')
    usuarios.value = res.rows || res.usuarios || []
  } finally {
    carregando.value = false
  }
}

async function cadastrar() {
  erro.value = ''
  try {
    await api.post('auth/cadastrar-usuario', { ...novo, empresaid: auth.empresa?.id, token: auth.token })
    Object.assign(novo, { nome: '', email: '', senha: '', perfil: 'motorista' })
    mostrarForm.value = false
    await carregar()
  } catch (e) {
    erro.value = e.message
  }
}

async function redefinirSenha(id) {
  msgRedefinir.value = ''
  try {
    await api.post('auth/usuarios-redefinir-senha', { id, novaSenha: novaSenha.value })
    msgRedefinirErro.value = false
    msgRedefinir.value = 'Senha redefinida com sucesso.'
    novaSenha.value = ''
  } catch (e) {
    msgRedefinirErro.value = true
    msgRedefinir.value = e.message
  }
}

onMounted(carregar)
</script>
