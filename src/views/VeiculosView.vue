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
      <div v-for="v in veiculos" :key="v.id" class="bg-white border border-slate-200 rounded-xl p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-slate-900">{{ v.placa }}</p>
            <p class="text-sm text-slate-500">{{ v.modelo || '—' }} · {{ v.motorista || '—' }}</p>
          </div>
          <div class="flex items-center gap-2">
            <span :class="v.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'" class="text-xs px-2 py-1 rounded-full">
              {{ v.ativo ? 'Ativo' : 'Inativo' }}
            </span>
            <button @click="abrirEdicao(v)" class="text-xs text-indigo-600 underline">Editar</button>
            <button @click="excluir(v)" class="text-xs text-red-600 underline">Excluir</button>
          </div>
        </div>

        <form v-if="editando === v.id" @submit.prevent="salvarEdicao(v.id)" class="mt-3 border-t border-slate-100 pt-3 space-y-2">
          <input v-model="edicao.placa" placeholder="Placa" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input v-model="edicao.modelo" placeholder="Modelo" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input v-model="edicao.motorista" placeholder="Motorista" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <div class="flex gap-2">
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm">Salvar</button>
            <button type="button" @click="editando = null" class="bg-slate-100 rounded-lg px-4 py-2 text-sm">Cancelar</button>
          </div>
          <p v-if="erroEdicao" class="text-red-600 text-sm">{{ erroEdicao }}</p>
        </form>
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

const editando = ref(null)
const erroEdicao = ref('')
const edicao = reactive({ placa: '', modelo: '', motorista: '' })

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

function abrirEdicao(v) {
  editando.value = editando.value === v.id ? null : v.id
  erroEdicao.value = ''
  edicao.placa = v.placa
  edicao.modelo = v.modelo || ''
  edicao.motorista = v.motorista || ''
}

async function salvarEdicao(id) {
  erroEdicao.value = ''
  try {
    await api.post('veiculos/editar', { id, ...edicao })
    editando.value = null
    await carregar()
  } catch (e) {
    erroEdicao.value = e.message
  }
}

async function excluir(v) {
  if (!confirm(`Excluir o veículo ${v.placa}? Ele fica inativo, sem apagar o histórico de manutenção/vistoria.`)) return
  try {
    await api.post('veiculos/inativar', { id: v.id })
    await carregar()
  } catch (e) {
    erro.value = e.message
  }
}

onMounted(carregar)
</script>
