<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4">
      <router-link to="/" class="text-slate-500 text-sm">← Voltar</router-link>
      <h1 class="text-lg font-semibold text-slate-900">Contas do mês</h1>
      <button @click="mostrarForm = !mostrarForm" class="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-lg">
        {{ mostrarForm ? 'Cancelar' : '+ Conta' }}
      </button>
    </div>

    <div class="bg-white border border-slate-200 rounded-xl p-4 mb-4 grid grid-cols-3 gap-2 text-center" v-if="resumo">
      <div>
        <p class="text-xs text-slate-500">Total</p>
        <p class="font-semibold text-slate-900">R$ {{ Number(resumo.total).toFixed(2) }}</p>
      </div>
      <div>
        <p class="text-xs text-slate-500">Pago</p>
        <p class="font-semibold text-green-600">R$ {{ Number(resumo.totalPago).toFixed(2) }}</p>
      </div>
      <div>
        <p class="text-xs text-slate-500">Em aberto</p>
        <p class="font-semibold text-red-600">R$ {{ Number(resumo.totalAberto).toFixed(2) }}</p>
      </div>
    </div>

    <form v-if="mostrarForm" @submit.prevent="adicionar" class="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
      <input v-model="novo.data" placeholder="Data (dd/mm)" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <input v-model="novo.descricao" placeholder="Descrição" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <input v-model.number="novo.valor" type="number" placeholder="Valor (R$)" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <p v-if="erro" class="text-red-600 text-sm">{{ erro }}</p>
      <button type="submit" class="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm">Salvar</button>
    </form>

    <p v-if="carregando" class="text-slate-500 text-sm">Carregando...</p>
    <div v-else class="space-y-2">
      <div v-for="c in contas" :key="c.id" class="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p class="font-medium text-slate-900">{{ c.descricao }}</p>
          <p class="text-sm text-slate-500">{{ c.data }} · R$ {{ Number(c.valor).toFixed(2) }}</p>
        </div>
        <button @click="togglePago(c.id)" :class="c.pago ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'" class="text-xs px-3 py-1.5 rounded-full font-medium">
          {{ c.pago ? 'Pago' : 'Marcar pago' }}
        </button>
      </div>
      <p v-if="!contas.length" class="text-slate-400 text-sm text-center py-8">Nenhuma conta neste mês.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { api } from '@/api'

const contas = ref([])
const resumo = ref(null)
const carregando = ref(true)
const mostrarForm = ref(false)
const erro = ref('')
const novo = reactive({ data: '', descricao: '', valor: null })

async function carregar() {
  carregando.value = true
  try {
    const res = await api.get('contas/listar')
    contas.value = res.contas || []
    resumo.value = res
  } finally {
    carregando.value = false
  }
}

async function adicionar() {
  erro.value = ''
  try {
    await api.post('contas/adicionar', { ...novo })
    Object.assign(novo, { data: '', descricao: '', valor: null })
    mostrarForm.value = false
    await carregar()
  } catch (e) {
    erro.value = e.message
  }
}

async function togglePago(id) {
  try {
    await api.post('contas/toggle-pago', { id })
    await carregar()
  } catch (e) {
    erro.value = e.message
  }
}

onMounted(carregar)
</script>
