<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4">
      <router-link to="/" class="text-slate-500 text-sm">← Voltar</router-link>
      <h1 class="text-lg font-semibold text-slate-900">Frota</h1>
      <button @click="mostrarForm = !mostrarForm" class="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-lg">
        {{ mostrarForm ? 'Cancelar' : '+ Veículo' }}
      </button>
    </div>

    <form v-if="mostrarForm" @submit.prevent="cadastrar" class="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
      <input v-model="novo.placa" placeholder="Placa" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <input v-model="novo.modelo" placeholder="Modelo" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <input v-model="novo.motorista" placeholder="Motorista" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <p v-if="erro" class="text-red-600 text-sm">{{ erro }}</p>
      <button type="submit" class="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm">Salvar</button>
    </form>

    <p v-if="carregando" class="text-slate-500 text-sm">Carregando...</p>
    <div v-else class="space-y-2">
      <div v-for="v in veiculos" :key="v.id" class="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p class="font-medium text-slate-900">{{ v.placa }}</p>
          <p class="text-sm text-slate-500">{{ v.modelo || '—' }} · {{ v.motorista || '—' }}</p>
        </div>
        <span :class="v.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'" class="text-xs px-2 py-1 rounded-full">
          {{ v.ativo ? 'Ativo' : 'Inativo' }}
        </span>
      </div>
      <p v-if="!veiculos.length" class="text-slate-400 text-sm text-center py-8">Nenhum veículo cadastrado.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { api } from '@/api'

const veiculos = ref([])
const carregando = ref(true)
const mostrarForm = ref(false)
const erro = ref('')
const novo = reactive({ placa: '', modelo: '', motorista: '' })

async function carregar() {
  carregando.value = true
  try {
    const res = await api.get('veiculos/listar')
    veiculos.value = res.rows || res.veiculos || []
  } finally {
    carregando.value = false
  }
}

async function cadastrar() {
  erro.value = ''
  try {
    await api.post('veiculos/cadastrar', { ...novo })
    novo.placa = ''; novo.modelo = ''; novo.motorista = ''
    mostrarForm.value = false
    await carregar()
  } catch (e) {
    erro.value = e.message
  }
}

onMounted(carregar)
</script>
