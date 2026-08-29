<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4">
      <router-link to="/" class="text-slate-500 text-sm">← Voltar</router-link>
      <h1 class="text-lg font-semibold text-slate-900">Motoristas</h1>
      <button @click="mostrarForm = !mostrarForm" class="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg">
        {{ mostrarForm ? 'Cancelar' : '+ Novo' }}
      </button>
    </div>

    <form v-if="mostrarForm" @submit.prevent="cadastrar" class="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
      <input v-model="novo.nome" placeholder="Nome completo" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <input v-model="novo.cpfCnpj" placeholder="CPF (só números)" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <input v-model="novo.telefone" placeholder="Telefone / WhatsApp" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <input v-model="novo.email" type="email" placeholder="E-mail" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <details class="text-sm text-slate-500">
        <summary class="cursor-pointer select-none">Endereço (opcional)</summary>
        <div class="mt-2 space-y-2">
          <input v-model="novo.logradouro" placeholder="Logradouro" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
          <div class="flex gap-2">
            <input v-model="novo.numero" placeholder="Número" class="w-24 border border-slate-300 rounded-lg px-3 py-2" />
            <input v-model="novo.bairro" placeholder="Bairro" class="flex-1 border border-slate-300 rounded-lg px-3 py-2" />
          </div>
          <div class="flex gap-2">
            <input v-model="novo.cidade" placeholder="Cidade" class="flex-1 border border-slate-300 rounded-lg px-3 py-2" />
            <input v-model="novo.uf" placeholder="UF" maxlength="2" class="w-16 border border-slate-300 rounded-lg px-3 py-2" />
            <input v-model="novo.cep" placeholder="CEP" class="w-28 border border-slate-300 rounded-lg px-3 py-2" />
          </div>
        </div>
      </details>
      <p v-if="erro" class="text-red-600 text-sm">{{ erro }}</p>
      <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm">Cadastrar</button>
    </form>

    <p v-if="carregando" class="text-slate-500 text-sm">Carregando...</p>
    <div v-else class="space-y-2">
      <div v-for="m in motoristas" :key="m.id" class="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p class="font-medium text-slate-900">{{ m.nome }}</p>
          <p class="text-sm text-slate-500">{{ m.cpf_cnpj || 'CPF não informado' }} · {{ m.telefone || '—' }}</p>
        </div>
        <button @click="inativar(m.id)" class="text-xs text-red-600 underline">Remover</button>
      </div>
      <p v-if="!motoristas.length" class="text-slate-400 text-sm text-center py-8">Nenhum motorista cadastrado.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { api } from '@/api'

const motoristas = ref([])
const carregando = ref(true)
const mostrarForm = ref(false)
const erro = ref('')
const novo = reactive({ nome: '', cpfCnpj: '', telefone: '', email: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: '', cep: '' })

async function carregar() {
  carregando.value = true
  try {
    const res = await api.get('motoristas/listar')
    motoristas.value = res.rows || res.motoristas || []
  } finally {
    carregando.value = false
  }
}

async function cadastrar() {
  erro.value = ''
  try {
    await api.post('motoristas/cadastrar', { ...novo })
    Object.assign(novo, { nome: '', cpfCnpj: '', telefone: '', email: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: '', cep: '' })
    mostrarForm.value = false
    await carregar()
  } catch (e) {
    erro.value = e.message
  }
}

async function inativar(id) {
  if (!confirm('Remover este motorista? Os veículos vinculados a ele continuam com o nome salvo, só o cadastro fica inativo.')) return
  try {
    await api.post('motoristas/inativar', { id })
    await carregar()
  } catch (e) {
    erro.value = e.message
  }
}

onMounted(carregar)
</script>
